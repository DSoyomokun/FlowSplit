from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.database import SessionDep
from app.core.security import verify_supabase_token
from app.crud import get_user, get_or_create_user
from app.models.user import User

security = HTTPBearer()


async def get_current_user(
    session: SessionDep,
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
) -> User:
    """
    Verify Supabase JWT and get/create user in our database.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = credentials.credentials
    payload = verify_supabase_token(token)

    if payload is None:
        raise credentials_exception

    # Extract user info from Supabase JWT
    supabase_user_id = payload.get("sub")
    if not supabase_user_id:
        raise credentials_exception

    # Get user metadata from token
    user_metadata = payload.get("user_metadata", {})
    email = payload.get("email")
    phone = payload.get("phone")

    # Get or create user in our database
    user = await get_or_create_user(
        session,
        supabase_id=supabase_user_id,
        email=email,
        phone_number=phone,
        full_name=user_metadata.get("full_name"),
    )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )

    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
