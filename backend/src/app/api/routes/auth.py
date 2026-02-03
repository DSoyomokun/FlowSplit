from fastapi import APIRouter

from app.api.deps import CurrentUser
from app.schemas.user import UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: CurrentUser) -> UserResponse:
    """
    Get current authenticated user info.
    User is automatically created/synced from Supabase JWT on first request.
    """
    return UserResponse.model_validate(current_user)
