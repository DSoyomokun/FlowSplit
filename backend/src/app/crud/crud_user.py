from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


async def get_user(session: AsyncSession, user_id: str) -> User | None:
    result = await session.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_user_by_supabase_id(session: AsyncSession, supabase_id: str) -> User | None:
    result = await session.execute(
        select(User).where(User.supabase_id == supabase_id)
    )
    return result.scalar_one_or_none()


async def get_user_by_phone(session: AsyncSession, phone_number: str) -> User | None:
    result = await session.execute(
        select(User).where(User.phone_number == phone_number)
    )
    return result.scalar_one_or_none()


async def get_user_by_email(session: AsyncSession, email: str) -> User | None:
    result = await session.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_or_create_user(
    session: AsyncSession,
    supabase_id: str,
    email: str | None = None,
    phone_number: str | None = None,
    full_name: str | None = None,
) -> User:
    """
    Get existing user by Supabase ID or create a new one.
    Also updates user info if it has changed.
    """
    user = await get_user_by_supabase_id(session, supabase_id)

    if user:
        # Update user info if changed
        updated = False
        if email and user.email != email:
            user.email = email
            updated = True
        if phone_number and user.phone_number != phone_number:
            user.phone_number = phone_number
            updated = True
        if full_name and user.full_name != full_name:
            user.full_name = full_name
            updated = True
        if updated:
            await session.flush()
            await session.refresh(user)
        return user

    # Create new user
    user = User(
        supabase_id=supabase_id,
        email=email,
        phone_number=phone_number,
        full_name=full_name,
    )
    session.add(user)
    await session.flush()
    await session.refresh(user)
    return user


async def update_user(
    session: AsyncSession,
    user: User,
    full_name: str | None = None,
) -> User:
    """Update user profile fields (not auth fields - those come from Supabase)."""
    if full_name is not None:
        user.full_name = full_name

    await session.flush()
    await session.refresh(user)
    return user
