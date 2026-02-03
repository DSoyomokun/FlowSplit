from fastapi import APIRouter, HTTPException, status

from app.api.deps import CurrentUser
from app.core.database import SessionDep
from app.crud import (
    approve_split_plan,
    create_split_plan,
    get_buckets_by_user,
    get_deposit,
    get_split_plan,
    get_split_plan_by_deposit,
)
from app.models.split_plan import SplitPlanStatus
from app.schemas.split_plan import (
    SplitActionCreate,
    SplitPlanCreate,
    SplitPlanPreview,
    SplitPlanResponse,
)
from app.services.allocation import calculate_allocation

router = APIRouter(prefix="/split-plans", tags=["split-plans"])


@router.get("/preview/{deposit_id}", response_model=SplitPlanPreview)
async def preview_split_plan(
    session: SessionDep,
    current_user: CurrentUser,
    deposit_id: str,
) -> SplitPlanPreview:
    deposit = await get_deposit(session, deposit_id)
    if not deposit or deposit.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Deposit not found"
        )

    buckets = await get_buckets_by_user(session, current_user.id)
    if not buckets:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No buckets configured",
        )

    allocations = calculate_allocation(float(deposit.amount), buckets)

    return SplitPlanPreview(
        deposit_id=deposit_id,
        total_amount=float(deposit.amount),
        actions=[
            SplitActionCreate(bucket_id=bucket_id, amount=amount)
            for bucket_id, amount in allocations.items()
        ],
    )


@router.post("", response_model=SplitPlanResponse, status_code=status.HTTP_201_CREATED)
async def create_new_split_plan(
    session: SessionDep,
    current_user: CurrentUser,
    plan_in: SplitPlanCreate,
) -> SplitPlanResponse:
    deposit = await get_deposit(session, plan_in.deposit_id)
    if not deposit or deposit.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Deposit not found"
        )

    existing_plan = await get_split_plan_by_deposit(session, plan_in.deposit_id)
    if existing_plan:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Split plan already exists for this deposit",
        )

    plan = await create_split_plan(session, plan_in)
    return SplitPlanResponse.model_validate(plan)


@router.get("/{plan_id}", response_model=SplitPlanResponse)
async def get_split_plan_by_id(
    session: SessionDep,
    current_user: CurrentUser,
    plan_id: str,
) -> SplitPlanResponse:
    plan = await get_split_plan(session, plan_id)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Split plan not found"
        )

    deposit = await get_deposit(session, plan.deposit_id)
    if not deposit or deposit.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Split plan not found"
        )

    return SplitPlanResponse.model_validate(plan)


@router.post("/{plan_id}/approve", response_model=SplitPlanResponse)
async def approve_split_plan_by_id(
    session: SessionDep,
    current_user: CurrentUser,
    plan_id: str,
) -> SplitPlanResponse:
    plan = await get_split_plan(session, plan_id)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Split plan not found"
        )

    deposit = await get_deposit(session, plan.deposit_id)
    if not deposit or deposit.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Split plan not found"
        )

    if plan.status != SplitPlanStatus.DRAFT.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Split plan cannot be approved in its current state",
        )

    plan = await approve_split_plan(session, plan)
    return SplitPlanResponse.model_validate(plan)
