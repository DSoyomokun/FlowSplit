from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.deposit import Deposit, DepositStatus
from app.schemas.deposit import DepositCreate


async def get_deposit(session: AsyncSession, deposit_id: str) -> Deposit | None:
    result = await session.execute(
        select(Deposit)
        .where(Deposit.id == deposit_id)
        .options(selectinload(Deposit.split_plan))
    )
    return result.scalar_one_or_none()


async def get_deposits_by_user(
    session: AsyncSession,
    user_id: str,
    limit: int = 50,
    offset: int = 0,
) -> list[Deposit]:
    result = await session.execute(
        select(Deposit)
        .where(Deposit.user_id == user_id)
        .order_by(Deposit.detected_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(result.scalars().all())


async def get_pending_deposits(
    session: AsyncSession, user_id: str
) -> list[Deposit]:
    result = await session.execute(
        select(Deposit)
        .where(
            Deposit.user_id == user_id,
            Deposit.status == DepositStatus.PENDING.value,
        )
        .order_by(Deposit.detected_at.desc())
    )
    return list(result.scalars().all())


async def create_deposit(
    session: AsyncSession, user_id: str, deposit_in: DepositCreate
) -> Deposit:
    deposit = Deposit(
        user_id=user_id,
        **deposit_in.model_dump(),
    )
    session.add(deposit)
    await session.flush()
    await session.refresh(deposit)
    return deposit


async def update_deposit_status(
    session: AsyncSession, deposit: Deposit, status: DepositStatus
) -> Deposit:
    deposit.status = status.value
    await session.flush()
    await session.refresh(deposit)
    return deposit
