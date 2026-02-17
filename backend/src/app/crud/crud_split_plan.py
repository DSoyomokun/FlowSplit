from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.split_plan import SplitAction, SplitPlan, SplitPlanStatus
from app.schemas.split_plan import SplitPlanCreate


def _plan_load_options():
    """Standard eager-loading options for split plans."""
    return [
        selectinload(SplitPlan.actions).selectinload(SplitAction.bucket),
    ]


async def get_split_plan(session: AsyncSession, plan_id: str) -> SplitPlan | None:
    result = await session.execute(
        select(SplitPlan)
        .where(SplitPlan.id == plan_id)
        .options(*_plan_load_options())
    )
    return result.scalar_one_or_none()


async def get_split_plan_by_deposit(
    session: AsyncSession, deposit_id: str
) -> SplitPlan | None:
    result = await session.execute(
        select(SplitPlan)
        .where(SplitPlan.deposit_id == deposit_id)
        .options(*_plan_load_options())
    )
    return result.scalar_one_or_none()


async def create_split_plan(
    session: AsyncSession, plan_in: SplitPlanCreate
) -> SplitPlan:
    plan = SplitPlan(
        deposit_id=plan_in.deposit_id,
        total_amount=plan_in.total_amount,
        status=SplitPlanStatus.DRAFT.value,
    )
    session.add(plan)
    await session.flush()

    for action_in in plan_in.actions:
        action = SplitAction(
            split_plan_id=plan.id,
            bucket_id=action_in.bucket_id,
            amount=action_in.amount,
        )
        session.add(action)

    await session.flush()
    await session.refresh(plan)

    # Load actions with bucket relationships
    result = await session.execute(
        select(SplitPlan)
        .where(SplitPlan.id == plan.id)
        .options(*_plan_load_options())
    )
    return result.scalar_one()


async def approve_split_plan(
    session: AsyncSession, plan: SplitPlan
) -> SplitPlan:
    plan.status = SplitPlanStatus.APPROVED.value
    plan.approved_at = datetime.now(timezone.utc)
    await session.flush()
    await session.refresh(plan)
    return plan


async def execute_split_plan(
    session: AsyncSession, plan: SplitPlan
) -> SplitPlan:
    plan.status = SplitPlanStatus.EXECUTING.value
    await session.flush()
    await session.refresh(plan)
    return plan


async def complete_split_plan(
    session: AsyncSession, plan: SplitPlan
) -> SplitPlan:
    plan.status = SplitPlanStatus.COMPLETED.value
    plan.executed_at = datetime.now(timezone.utc)
    await session.flush()
    await session.refresh(plan)
    return plan


async def mark_action_executed(
    session: AsyncSession, action: SplitAction
) -> SplitAction:
    action.executed = True
    action.executed_at = datetime.now(timezone.utc)
    await session.flush()
    await session.refresh(action)
    return action
