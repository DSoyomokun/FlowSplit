"""
Plaid webhook endpoint.

Plaid signs every webhook with a JWT in the `Plaid-Verification` header.
Verification steps:
  1. Decode the JWT header (unverified) to get `kid`
  2. Fetch the matching public key from Plaid's /webhook_verification_key/get
  3. Verify the JWT signature (ES256) using python-jose
  4. Assert the JWT's `request_body_sha256` matches SHA-256 of the raw request body
  5. Assert the JWT was issued within the last 5 minutes

In development (no Plaid client / sandbox), verification is skipped with a warning.
"""
import asyncio
import hashlib
import json
import logging
import time

from fastapi import APIRouter, HTTPException, Request, status

from app.core.config import settings
from app.core.database import SessionDep
from app.services.deposit_detection import sync_new_transactions
from app.services.plaid import plaid_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

# Plaid webhook types we care about
_TRANSACTION_CODES = {"SYNC_UPDATES_AVAILABLE", "DEFAULT_UPDATE"}


# ---------------------------------------------------------------------------
# Signature verification
# ---------------------------------------------------------------------------

async def _verify_plaid_signature(token: str, raw_body: bytes) -> None:
    """
    Verify the Plaid-Verification JWT.
    Raises HTTPException(401) on any failure.
    """
    try:
        import jwt as pyjwt  # PyJWT
        from jose import jwt as jose_jwt, JWTError
        from plaid.model.webhook_verification_key_get_request import (
            WebhookVerificationKeyGetRequest,
        )
    except ImportError as e:
        logger.warning("Webhook verification skipped — missing dependency: %s", e)
        return

    client = plaid_service.client
    if client is None:
        logger.warning("Webhook verification skipped — Plaid client not initialized")
        return

    # Step 1: get kid from JWT header without verifying
    try:
        header = pyjwt.get_unverified_header(token)
    except Exception:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid Plaid-Verification JWT header")

    key_id = header.get("kid")
    if not key_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing kid in Plaid-Verification JWT")

    # Step 2: fetch public key from Plaid
    try:
        key_response = await asyncio.to_thread(
            client.webhook_verification_key_get,
            WebhookVerificationKeyGetRequest(key_id=key_id),
        )
        key = key_response.key
    except Exception as e:
        logger.error("Failed to fetch Plaid verification key: %s", e)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Could not fetch Plaid verification key")

    # Step 3: build JWK and verify JWT
    jwk = {"kty": key.kty, "crv": key.crv, "x": key.x, "y": key.y}
    try:
        claims = jose_jwt.decode(token, jwk, algorithms=["ES256"])
    except JWTError as e:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, f"Plaid JWT verification failed: {e}")

    # Step 4: verify body hash
    expected_hash = hashlib.sha256(raw_body).hexdigest()
    if claims.get("request_body_sha256") != expected_hash:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Webhook body hash mismatch")

    # Step 5: freshness check (issued within 5 minutes)
    iat = claims.get("iat", 0)
    if time.time() - iat > 300:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Plaid JWT is too old")


# ---------------------------------------------------------------------------
# Webhook endpoint
# ---------------------------------------------------------------------------

@router.post("/plaid", status_code=status.HTTP_200_OK)
async def plaid_webhook(request: Request, db: SessionDep) -> dict:
    """
    Receive and process Plaid webhooks.

    Plaid signs requests with the Plaid-Verification JWT header.
    We verify the signature before processing any payload.
    """
    raw_body = await request.body()

    # Verify signature when Plaid client is available
    plaid_verification = request.headers.get("Plaid-Verification")
    if plaid_verification:
        await _verify_plaid_signature(plaid_verification, raw_body)
    elif settings.plaid_environment == "production":
        # In production, the header must always be present
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Missing Plaid-Verification header",
        )
    else:
        logger.warning("Plaid-Verification header missing — skipping signature check (non-production)")

    try:
        payload = json.loads(raw_body)
    except json.JSONDecodeError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid JSON body")

    webhook_type: str = payload.get("webhook_type", "")
    webhook_code: str = payload.get("webhook_code", "")
    item_id: str = payload.get("item_id", "")

    logger.info("Plaid webhook: type=%s code=%s item_id=%s", webhook_type, webhook_code, item_id)

    if webhook_type == "TRANSACTIONS" and webhook_code in _TRANSACTION_CODES:
        if not item_id:
            logger.warning("TRANSACTIONS webhook missing item_id")
            return {"status": "ignored", "reason": "missing item_id"}

        # Inline sync for MVP (no job queue needed at this scale)
        new_deposits = await sync_new_transactions(db, item_id)
        return {"status": "ok", "new_deposits": len(new_deposits)}

    # All other webhook types are acknowledged but not acted on
    return {"status": "ignored", "webhook_type": webhook_type, "webhook_code": webhook_code}
