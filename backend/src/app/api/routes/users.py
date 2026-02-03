from fastapi import APIRouter

from app.api.deps import CurrentUser
from app.core.database import SessionDep
from app.crud import update_user
from app.schemas.user import UserResponse, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: CurrentUser) -> UserResponse:
    """Get current user profile."""
    return UserResponse.model_validate(current_user)


@router.patch("/me", response_model=UserResponse)
async def update_current_user(
    session: SessionDep,
    current_user: CurrentUser,
    user_in: UserUpdate,
) -> UserResponse:
    """Update current user profile (only app-specific fields, not auth)."""
    user = await update_user(session, current_user, full_name=user_in.full_name)
    return UserResponse.model_validate(user)
