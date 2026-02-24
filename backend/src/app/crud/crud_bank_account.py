from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.bank_account import BankAccount
from app.schemas.bank_account import BankAccountCreate, BankAccountUpdate


async def get_bank_account(
    session: AsyncSession, bank_account_id: str
) -> BankAccount | None:
    result = await session.execute(
        select(BankAccount).where(BankAccount.id == bank_account_id)
    )
    return result.scalar_one_or_none()


async def get_bank_accounts_by_user(
    session: AsyncSession, user_id: str, active_only: bool = True
) -> list[BankAccount]:
    query = select(BankAccount).where(BankAccount.user_id == user_id)
    if active_only:
        query = query.where(BankAccount.is_active == True)  # noqa: E712
    query = query.order_by(BankAccount.is_primary.desc(), BankAccount.created_at)
    result = await session.execute(query)
    return list(result.scalars().all())


async def get_bank_account_by_plaid_account_id(
    session: AsyncSession, plaid_account_id: str
) -> BankAccount | None:
    result = await session.execute(
        select(BankAccount).where(
            BankAccount.plaid_account_id == plaid_account_id,
            BankAccount.is_active == True,  # noqa: E712
        )
    )
    return result.scalar_one_or_none()


async def create_bank_account(
    session: AsyncSession, user_id: str, account_in: BankAccountCreate
) -> BankAccount:
    bank_account = BankAccount(
        user_id=user_id,
        **account_in.model_dump(),
    )
    session.add(bank_account)
    await session.flush()
    await session.refresh(bank_account)
    return bank_account


async def update_bank_account(
    session: AsyncSession, bank_account: BankAccount, account_in: BankAccountUpdate
) -> BankAccount:
    update_data = account_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(bank_account, field, value)

    await session.flush()
    await session.refresh(bank_account)
    return bank_account


async def deactivate_bank_account(
    session: AsyncSession, bank_account: BankAccount
) -> None:
    bank_account.is_active = False
    await session.flush()


async def set_primary_bank_account(
    session: AsyncSession, user_id: str, bank_account_id: str
) -> BankAccount | None:
    # Unset all primary for this user
    await session.execute(
        update(BankAccount)
        .where(BankAccount.user_id == user_id)
        .values(is_primary=False)
    )
    # Set the selected one as primary
    bank_account = await get_bank_account(session, bank_account_id)
    if bank_account and bank_account.user_id == user_id:
        bank_account.is_primary = True
        await session.flush()
        await session.refresh(bank_account)
    return bank_account
