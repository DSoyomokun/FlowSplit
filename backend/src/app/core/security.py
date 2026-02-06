import logging
import ssl
import certifi
import jwt
from jwt import PyJWKClient

from app.core.config import settings

logger = logging.getLogger(__name__)

# Cache for JWKS client
_jwks_client: PyJWKClient | None = None


def get_jwks_client() -> PyJWKClient:
    """Get or create JWKS client for Supabase JWT verification."""
    global _jwks_client
    if _jwks_client is None:
        jwks_url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
        # Use certifi for SSL certificates (fixes macOS issues)
        ssl_context = ssl.create_default_context(cafile=certifi.where())
        _jwks_client = PyJWKClient(jwks_url, ssl_context=ssl_context)
    return _jwks_client


def verify_supabase_token(token: str) -> dict | None:
    """
    Verify a Supabase JWT token.
    Returns the decoded payload if valid, None otherwise.
    """
    try:
        # Get the algorithm from the token header
        unverified_header = jwt.get_unverified_header(token)
        algorithm = unverified_header.get("alg", "HS256")
        logger.info(f"Token algorithm: {algorithm}")

        # ES256/RS256 tokens use JWKS for verification
        if algorithm in ["ES256", "RS256"]:
            logger.info("Using JWKS verification")
            jwks_client = get_jwks_client()
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=[algorithm],
                audience="authenticated",
            )
            logger.info(f"Token verified successfully for user: {payload.get('sub')}")
            return payload

        # HS256 tokens use the JWT secret directly
        if settings.supabase_jwt_secret:
            logger.info("Using JWT secret verification")
            payload = jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                audience="authenticated",
            )
            logger.info(f"Token verified successfully for user: {payload.get('sub')}")
            return payload

        logger.warning("No verification method available")
        return None

    except jwt.ExpiredSignatureError:
        logger.error("Token expired")
        return None
    except jwt.InvalidTokenError as e:
        logger.error(f"Invalid token: {e}")
        return None
    except Exception as e:
        logger.error(f"Token verification error: {e}")
        return None


def get_user_id_from_token(token: str) -> str | None:
    """Extract user ID from Supabase JWT token."""
    payload = verify_supabase_token(token)
    if payload:
        return payload.get("sub")
    return None
