import httpx
import jwt
from jwt import PyJWKClient

from app.core.config import settings

# Cache for JWKS client
_jwks_client: PyJWKClient | None = None


def get_jwks_client() -> PyJWKClient:
    """Get or create JWKS client for Supabase JWT verification."""
    global _jwks_client
    if _jwks_client is None:
        jwks_url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
        _jwks_client = PyJWKClient(jwks_url)
    return _jwks_client


def verify_supabase_token(token: str) -> dict | None:
    """
    Verify a Supabase JWT token.
    Returns the decoded payload if valid, None otherwise.
    """
    try:
        # Method 1: Using JWT secret directly (simpler, works offline)
        if settings.supabase_jwt_secret:
            payload = jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                audience="authenticated",
            )
            return payload

        # Method 2: Using JWKS (more secure, requires network)
        jwks_client = get_jwks_client()
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience="authenticated",
        )
        return payload

    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
    except Exception:
        return None


def get_user_id_from_token(token: str) -> str | None:
    """Extract user ID from Supabase JWT token."""
    payload = verify_supabase_token(token)
    if payload:
        return payload.get("sub")
    return None
