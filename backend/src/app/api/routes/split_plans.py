from fastapi import APIRouter, HTTPException, status, BackgroundTasks

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
    SplitExecutionResponse,
)
from app.services.allocation import calculate_allocation
from app.services.split_execution import split_execution_service

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
        # Return the existing plan instead of erroring (idempotent)
        return SplitPlanResponse.model_validate(existing_plan)

    plan = await create_split_plan(session, plan_in)
    return SplitPlanResponse.model_validate(plan)


@router.get("/by-deposit/{deposit_id}", response_model=SplitPlanResponse)
async def get_split_plan_for_deposit(
    session: SessionDep,
    current_user: CurrentUser,
    deposit_id: str,
) -> SplitPlanResponse:
    deposit = await get_deposit(session, deposit_id)
    if not deposit or deposit.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Deposit not found"
        )

    plan = await get_split_plan_by_deposit(session, deposit_id)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="No split plan for this deposit"
        )

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


@router.post("/{plan_id}/execute", response_model=SplitExecutionResponse)
async def execute_split_plan_by_id(
    session: SessionDep,
    current_user: CurrentUser,
    plan_id: str,
) -> SplitExecutionResponse:
    """
    Execute a split plan.

    The plan must be in APPROVED status. This endpoint will:
    1. Execute each action in the plan (transfers to buckets)
    2. Handle partial failures gracefully
    3. Return detailed status for each action
    """
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

    if plan.status not in (SplitPlanStatus.APPROVED.value, SplitPlanStatus.DRAFT.value):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Split plan cannot be executed in {plan.status} state",
        )

    # Auto-approve if still draft
    if plan.status == SplitPlanStatus.DRAFT.value:
        plan = await approve_split_plan(session, plan)

    # Execute the split
    result = await split_execution_service.execute_plan(
        session=session,
        plan=plan,
        deposit=deposit,
        user_phone=current_user.phone_number,
    )

    return SplitExecutionResponse(
        plan_id=result.plan_id,
        status=result.status,
        total_amount=result.total_amount,
        completed_amount=result.completed_amount,
        failed_amount=result.failed_amount,
        manual_amount=result.manual_amount,
        action_results=[
            {
                "action_id": ar.action_id,
                "bucket_id": ar.bucket_id,
                "status": ar.status.value,
                "amount": ar.amount,
                "error": ar.error,
                "external_url": ar.external_url,
                "transaction_id": ar.transaction_id,
            }
            for ar in result.action_results
        ],
        completed_at=result.completed_at,
    )


@router.post("/{plan_id}/retry", response_model=SplitExecutionResponse)
async def retry_failed_actions(
    session: SessionDep,
    current_user: CurrentUser,
    plan_id: str,
) -> SplitExecutionResponse:
    """
    Retry failed actions in a split plan.

    Only retries actions that have not been executed.
    """
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

    if plan.status != SplitPlanStatus.EXECUTING.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only executing plans can be retried",
        )

    result = await split_execution_service.retry_failed_actions(
        session=session,
        plan_id=plan_id,
    )

    return SplitExecutionResponse(
        plan_id=result.plan_id,
        status=result.status,
        total_amount=result.total_amount,
        completed_amount=result.completed_amount,
        failed_amount=result.failed_amount,
        manual_amount=result.manual_amount,
        action_results=[
            {
                "action_id": ar.action_id,
                "bucket_id": ar.bucket_id,
                "status": ar.status.value,
                "amount": ar.amount,
                "error": ar.error,
                "external_url": ar.external_url,
                "transaction_id": ar.transaction_id,
            }
            for ar in result.action_results
        ],
        completed_at=result.completed_at,
    )
