"""
FlowSplit Seed Data Script

Populates the database with realistic test data for development.
Run from the backend directory:

    cd backend/src
    python -m seed

Or from the backend directory:

    cd backend
    python seed.py

Usage:
    python seed.py                    # Uses first existing user in DB
    python seed.py --email test@x.com # Uses/finds user by email
    python seed.py --clean            # Wipe seed data before re-seeding
"""

import argparse
import asyncio
import sys
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path
from uuid import uuid4

# Ensure the src directory is on the path
sys.path.insert(0, str(Path(__file__).resolve().parent / "src"))

from sqlalchemy import select, delete as sa_delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session_maker, engine
from app.models import (
    BankAccount,
    Bucket,
    BucketType,
    Deposit,
    DepositStatus,
    SplitAction,
    SplitPlan,
    SplitPlanStatus,
    User,
)


# ---------------------------------------------------------------------------
# Seed data definitions
# ---------------------------------------------------------------------------

def uid() -> str:
    return str(uuid4())


def now() -> datetime:
    return datetime.now(timezone.utc)


def days_ago(n: int) -> datetime:
    return now() - timedelta(days=n)


# Pre-generate IDs so we can cross-reference
USER_ID = uid()
CHASE_ACCOUNT_ID = uid()
ALLY_ACCOUNT_ID = uid()
VENMO_ACCOUNT_ID = uid()

TITHE_BUCKET_ID = uid()
SAVINGS_BUCKET_ID = uid()
INVESTING_BUCKET_ID = uid()

DEPOSIT_PENDING_ID = uid()
DEPOSIT_COMPLETED_ID = uid()
DEPOSIT_PROCESSING_ID = uid()


BANK_ACCOUNTS = [
    {
        "id": CHASE_ACCOUNT_ID,
        "institution_name": "Chase",
        "name": "Chase Checking",
        "official_name": "Chase Total Checking",
        "mask": "4821",
        "type": "depository",
        "subtype": "checking",
        "is_primary": True,
    },
    {
        "id": ALLY_ACCOUNT_ID,
        "institution_name": "Ally Bank",
        "name": "Ally High-Yield Savings",
        "official_name": "Ally Bank Online Savings",
        "mask": "9928",
        "type": "depository",
        "subtype": "savings",
        "is_primary": False,
    },
    {
        "id": VENMO_ACCOUNT_ID,
        "institution_name": "Venmo",
        "name": "Venmo Balance",
        "official_name": None,
        "mask": "7712",
        "type": "depository",
        "subtype": "checking",
        "is_primary": False,
    },
]

BUCKETS = [
    {
        "id": TITHE_BUCKET_ID,
        "name": "Tithe",
        "emoji": "\u2764\ufe0f",
        "color": "#0EA5A5",
        "bucket_type": BucketType.PERCENTAGE.value,
        "allocation_value": Decimal("10"),
        "target_amount": None,
        "current_balance": Decimal("240.00"),
        "sort_order": 0,
    },
    {
        "id": SAVINGS_BUCKET_ID,
        "name": "Savings",
        "emoji": "\U0001f437",
        "color": "#3B82F6",
        "bucket_type": BucketType.PERCENTAGE.value,
        "allocation_value": Decimal("15"),
        "target_amount": Decimal("10000"),
        "current_balance": Decimal("3600.00"),
        "sort_order": 1,
    },
    {
        "id": INVESTING_BUCKET_ID,
        "name": "Investing",
        "emoji": "\U0001f4c8",
        "color": "#10B981",
        "bucket_type": BucketType.PERCENTAGE.value,
        "allocation_value": Decimal("10"),
        "target_amount": None,
        "current_balance": Decimal("1200.00"),
        "sort_order": 2,
    },
]

DEPOSITS = [
    # Pending deposit - ready to be split (matches the $1,200 in mockups)
    {
        "id": DEPOSIT_PENDING_ID,
        "amount": Decimal("1200.00"),
        "source": "Direct Deposit",
        "description": "Payroll - Acme Corp",
        "status": DepositStatus.PENDING.value,
        "detected_at": days_ago(0),
        "processed_at": None,
    },
    # Completed deposit - already split
    {
        "id": DEPOSIT_COMPLETED_ID,
        "amount": Decimal("2400.00"),
        "source": "Direct Deposit",
        "description": "Payroll - Acme Corp",
        "status": DepositStatus.COMPLETED.value,
        "detected_at": days_ago(14),
        "processed_at": days_ago(14),
    },
    # Processing deposit - mid-execution
    {
        "id": DEPOSIT_PROCESSING_ID,
        "amount": Decimal("800.00"),
        "source": "Venmo Transfer",
        "description": "Freelance payment",
        "status": DepositStatus.PROCESSING.value,
        "detected_at": days_ago(1),
        "processed_at": None,
    },
]



# ---------------------------------------------------------------------------
# Seed logic
# ---------------------------------------------------------------------------

async def find_or_create_user(session: AsyncSession, email: str | None) -> User:
    """Find an existing user or create a seed user."""

    # Try to find by email if provided
    if email:
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if user:
            print(f"  Found user by email: {user.email} (id={user.id})")
            return user

    # Try to find any existing user
    result = await session.execute(select(User).limit(1))
    user = result.scalar_one_or_none()
    if user:
        print(f"  Found existing user: {user.email or user.phone_number} (id={user.id})")
        return user

    # No users exist — create a seed user with a fake supabase_id.
    # This user won't pass JWT auth, but the data will be visible if you
    # later sign up with this email (the get_or_create_user flow will match).
    seed_supabase_id = f"seed-{uid()}"
    user = User(
        id=USER_ID,
        supabase_id=seed_supabase_id,
        email="dev@flowsplit.test",
        full_name="Dev User",
        is_active=True,
    )
    session.add(user)
    await session.flush()
    print(f"  Created seed user: dev@flowsplit.test (id={user.id})")
    print("  NOTE: Sign up in the app with this email to use the seeded data,")
    print("        or re-run with --email <your-supabase-email>.")
    return user


async def clean_seed_data(session: AsyncSession, user_id: str) -> None:
    """Remove all data for a user (keeps the user record)."""
    # Delete in dependency order
    # Actions are cascade-deleted via plans, plans via deposits
    await session.execute(
        sa_delete(Deposit).where(Deposit.user_id == user_id)
    )
    await session.execute(
        sa_delete(Bucket).where(Bucket.user_id == user_id)
    )
    await session.execute(
        sa_delete(BankAccount).where(BankAccount.user_id == user_id)
    )
    await session.flush()
    print("  Cleaned existing data for user.")


async def seed(email: str | None = None, clean: bool = False) -> None:
    print("\nFlowSplit Seed Script")
    print("=" * 40)

    async with async_session_maker() as session:
        try:
            # 1. Get or create user
            print("\n[1/5] User")
            user = await find_or_create_user(session, email)
            user_id = user.id

            # 2. Optionally clean existing data
            if clean:
                print("\n[clean] Removing existing data...")
                await clean_seed_data(session, user_id)

            # 3. Bank accounts
            print("\n[2/5] Bank Accounts")
            result = await session.execute(
                select(BankAccount).where(BankAccount.user_id == user_id)
            )
            existing_accounts = result.scalars().all()
            if existing_accounts:
                print(f"  Skipped — {len(existing_accounts)} bank accounts already exist.")
                primary_account_id = existing_accounts[0].id
            else:
                for acct_data in BANK_ACCOUNTS:
                    acct = BankAccount(user_id=user_id, **acct_data)
                    session.add(acct)
                await session.flush()
                primary_account_id = CHASE_ACCOUNT_ID
                print(f"  Created {len(BANK_ACCOUNTS)} bank accounts.")

            # 4. Buckets
            print("\n[3/5] Buckets")
            result = await session.execute(
                select(Bucket).where(Bucket.user_id == user_id, Bucket.is_active == True)
            )
            existing_buckets = result.scalars().all()
            if existing_buckets:
                print(f"  Skipped — {len(existing_buckets)} buckets already exist.")
                bucket_ids = [b.id for b in existing_buckets[:3]]
            else:
                for bucket_data in BUCKETS:
                    bucket = Bucket(user_id=user_id, **bucket_data)
                    session.add(bucket)
                await session.flush()
                bucket_ids = [TITHE_BUCKET_ID, SAVINGS_BUCKET_ID, INVESTING_BUCKET_ID]
                print(f"  Created {len(BUCKETS)} buckets (Tithe 10%, Savings 15%, Investing 10%).")

            # 5. Deposits
            print("\n[4/5] Deposits")
            result = await session.execute(
                select(Deposit).where(Deposit.user_id == user_id)
            )
            existing_deposits = result.scalars().all()
            if existing_deposits:
                print(f"  Skipped — {len(existing_deposits)} deposits already exist.")
                # Find deposits by status for split plan creation
                pending_dep = next((d for d in existing_deposits if d.status == "pending"), None)
                completed_dep = next((d for d in existing_deposits if d.status == "completed"), None)
                processing_dep = next((d for d in existing_deposits if d.status == "processing"), None)
            else:
                for dep_data in DEPOSITS:
                    dep = Deposit(user_id=user_id, bank_account_id=primary_account_id, **dep_data)
                    session.add(dep)
                await session.flush()
                print(f"  Created {len(DEPOSITS)} deposits:")
                print(f"    - $1,200.00 pending  (ready to split)")
                print(f"    - $2,400.00 completed (with split plan)")
                print(f"    - $800.00   processing (partially executed)")
                # Use a sentinel object to carry IDs
                pending_dep = type("D", (), {"id": DEPOSIT_PENDING_ID, "amount": 1200})()
                completed_dep = type("D", (), {"id": DEPOSIT_COMPLETED_ID, "amount": 2400})()
                processing_dep = type("D", (), {"id": DEPOSIT_PROCESSING_ID, "amount": 800})()

            # 6. Split Plans + Actions
            print("\n[5/5] Split Plans")
            # Check for existing plans
            result = await session.execute(
                select(SplitPlan).join(Deposit).where(Deposit.user_id == user_id)
            )
            existing_plans = result.scalars().all()
            if existing_plans:
                print(f"  Skipped — {len(existing_plans)} split plans already exist.")
            elif not completed_dep and not processing_dep:
                print("  Skipped — no completed/processing deposits to create plans for.")
            else:
                plans_created = 0

                # Completed plan
                if completed_dep:
                    plan_id = uid()
                    alloc = _allocate(float(completed_dep.amount), [10, 15, 10])
                    plan = SplitPlan(
                        id=plan_id,
                        deposit_id=completed_dep.id,
                        total_amount=Decimal(str(completed_dep.amount)),
                        status=SplitPlanStatus.COMPLETED.value,
                        approved_at=days_ago(14),
                        executed_at=days_ago(14),
                    )
                    session.add(plan)
                    for i, bid in enumerate(bucket_ids[:3]):
                        session.add(SplitAction(
                            id=uid(), split_plan_id=plan_id, bucket_id=bid,
                            amount=Decimal(str(alloc[i])),
                            executed=True, executed_at=days_ago(14),
                        ))
                    plans_created += 1

                # Processing plan (partial execution)
                if processing_dep:
                    plan_id = uid()
                    alloc = _allocate(float(processing_dep.amount), [10, 15, 10])
                    plan = SplitPlan(
                        id=plan_id,
                        deposit_id=processing_dep.id,
                        total_amount=Decimal(str(processing_dep.amount)),
                        status=SplitPlanStatus.EXECUTING.value,
                        approved_at=days_ago(1),
                        executed_at=None,
                    )
                    session.add(plan)
                    for i, bid in enumerate(bucket_ids[:3]):
                        executed = i < 2  # First 2 executed, last one pending
                        session.add(SplitAction(
                            id=uid(), split_plan_id=plan_id, bucket_id=bid,
                            amount=Decimal(str(alloc[i])),
                            executed=executed,
                            executed_at=days_ago(1) if executed else None,
                        ))
                    plans_created += 1

                await session.flush()
                print(f"  Created {plans_created} split plans.")

            await session.commit()

            # Summary
            print("\n" + "=" * 40)
            print("Seed complete!")
            print(f"\nUser: {user.email or user.phone_number} (id={user_id})")
            if pending_dep:
                print(f"Pending deposit: {pending_dep.id}")
                print("  Use this to test: setup -> allocate -> confirm -> complete")
            print("\nTip: Run with --clean to wipe and re-seed fresh data.")
            print()

        except Exception:
            await session.rollback()
            raise


def _allocate(total: float, percentages: list[int]) -> list[float]:
    """Simple helper to split a total by percentages."""
    return [round(total * p / 100, 2) for p in percentages]


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed FlowSplit development data")
    parser.add_argument("--email", help="Email of existing Supabase user to seed data for")
    parser.add_argument("--clean", action="store_true", help="Remove existing data before seeding")
    args = parser.parse_args()

    asyncio.run(seed(email=args.email, clean=args.clean))


if __name__ == "__main__":
    main()
