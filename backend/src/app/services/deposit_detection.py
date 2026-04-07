"""
Deposit detection service.

Triggered by Plaid TRANSACTIONS webhooks. Syncs new credit transactions,
creates Deposit rows, and auto-applies the user's first split template.
"""
import logging
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.bank_account import BankAccount
from app.models.deposit import Deposit, DepositStatus
from app.models.split_plan import SplitAction, SplitPlan, SplitPlanStatus
from app.models.split_template import SplitTemplate
from app.services.plaid import plaid_service

logger = logging.getLogger(__name__)


async def sync_new_transactions(db: AsyncSession, item_id: str) -> list[Deposit]:
    """
    Sync new Plaid transactions for a given item_id and create Deposit records.

    Steps:
    1. Look up BankAccount by plaid_item_id
    2. Call Plaid transactions/sync with stored cursor
    3. Filter to credit transactions, skip already-seen plaid_transaction_ids
    4. INSERT Deposit rows; call auto_apply_template for each
    5. Persist the updated sync cursor
    """
    result = await db.execute(
        select(BankAccount).where(
            BankAccount.plaid_item_id == item_id,
            BankAccount.is_active == True,  # noqa: E712
        )
    )
    bank_account = result.scalar_one_or_none()
    if not bank_account:
        logger.warning("sync_new_transactions: no bank account for item_id=%s", item_id)
        return []

    if not bank_account.plaid_access_token:
        logger.warning("sync_new_transactions: bank account %s has no access token", bank_account.id)
        return []

    try:
        transactions, next_cursor = await plaid_service.sync_transactions(
            access_token=bank_account.plaid_access_token,
            cursor=bank_account.cursor,
        )
    except Exception:
        logger.exception("Plaid sync failed for item_id=%s", item_id)
        return []

    new_deposits: list[Deposit] = []

    for tx in transactions:
        if not plaid_service.is_deposit_transaction(tx):
            continue

        # Deduplication — skip if we already have this transaction
        dup_check = await db.execute(
            select(Deposit).where(Deposit.plaid_transaction_id == tx.transaction_id)
        )
        if dup_check.scalar_one_or_none():
            logger.debug("Skipping duplicate plaid_transaction_id=%s", tx.transaction_id)
            continue

        deposit = Deposit(
            user_id=bank_account.user_id,
            bank_account_id=bank_account.id,
            amount=abs(tx.amount),
            source=tx.merchant_name or tx.name,
            plaid_transaction_id=tx.transaction_id,
            status=DepositStatus.DETECTED.value,
        )
        db.add(deposit)
        await db.flush()
        await db.refresh(deposit)

        await auto_apply_template(db, deposit)

        new_deposits.append(deposit)
        logger.info(
            "Created deposit %s (amount=%.2f, source=%s)",
            deposit.id, deposit.amount, deposit.source,
        )

    # Persist updated cursor even if no new deposits (advances the cursor)
    if next_cursor:
        bank_account.cursor = next_cursor
        await db.flush()

    await db.commit()

    logger.info(
        "sync_new_transactions done: item_id=%s, %d new deposits",
        item_id, len(new_deposits),
    )
    return new_deposits


async def auto_apply_template(db: AsyncSession, deposit: Deposit) -> SplitPlan | None:
    """
    Apply the user's first split template to a deposit, creating a SplitPlan.

    - If no template exists, deposit stays 'detected' for manual allocation.
    - If fixed allocations exceed the deposit amount, skip and leave as 'detected'.
    - On success, creates SplitPlan (status=pending_approval, source=auto)
      and updates deposit.status to 'pending_review'.
    """
    result = await db.execute(
        select(SplitTemplate)
        .where(SplitTemplate.user_id == deposit.user_id)
        .options(selectinload(SplitTemplate.items))
        .order_by(SplitTemplate.created_at)
        .limit(1)
    )
    template = result.scalar_one_or_none()

    if not template or not template.items:
        logger.info("No split template for user %s — deposit %s stays 'detected'", deposit.user_id, deposit.id)
        return None

    deposit_amount = Decimal(str(deposit.amount))
    action_amounts: list[tuple[str, Decimal]] = []
    fixed_total = Decimal("0")

    for item in template.items:
        if item.allocation_type == "fixed":
            amount = Decimal(str(item.allocation_value))
            fixed_total += amount
            action_amounts.append((item.bucket_id, amount))
        else:  # percentage
            amount = (deposit_amount * Decimal(str(item.allocation_value)) / Decimal("100")).quantize(
                Decimal("0.01")
            )
            action_amounts.append((item.bucket_id, amount))

    if fixed_total > deposit_amount:
        logger.info(
            "Skipping auto-apply for deposit %s: fixed total $%s > deposit $%s",
            deposit.id, fixed_total, deposit_amount,
        )
        return None

    plan = SplitPlan(
        deposit_id=deposit.id,
        total_amount=float(deposit_amount),
        status=SplitPlanStatus.PENDING_APPROVAL.value,
        source="auto",
    )
    db.add(plan)
    await db.flush()

    for bucket_id, amount in action_amounts:
        db.add(SplitAction(
            split_plan_id=plan.id,
            bucket_id=bucket_id,
            amount=float(amount),
        ))

    deposit.status = DepositStatus.PENDING_REVIEW.value
    await db.flush()
    await db.refresh(plan)

    logger.info(
        "Auto-applied template '%s' to deposit %s → plan %s",
        template.name, deposit.id, plan.id,
    )
    return plan
