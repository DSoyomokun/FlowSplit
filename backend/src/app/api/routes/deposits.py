from fastapi import APIRouter, HTTPException, status

from app.api.deps import CurrentUser
from app.core.database import SessionDep
from app.crud import create_deposit, get_deposit, get_deposits_by_user, get_pending_deposits
from app.schemas.deposit import DepositCreate, DepositResponse

router = APIRouter(prefix="/deposits", tags=["deposits"])


@router.get("", response_model=list[DepositResponse])
async def list_deposits(
    session: SessionDep,
    current_user: CurrentUser,
    limit: int = 50,
    offset: int = 0,
) -> list[DepositResponse]:
    deposits = await get_deposits_by_user(session, current_user.id, limit, offset)
    return [DepositResponse.model_validate(d) for d in deposits]


@router.get("/pending", response_model=list[DepositResponse])
async def list_pending_deposits(
    session: SessionDep,
    current_user: CurrentUser,
) -> list[DepositResponse]:
    deposits = await get_pending_deposits(session, current_user.id)
    return [DepositResponse.model_validate(d) for d in deposits]


@router.post("", response_model=DepositResponse, status_code=status.HTTP_201_CREATED)
async def create_new_deposit(
    session: SessionDep,
    current_user: CurrentUser,
    deposit_in: DepositCreate,
) -> DepositResponse:
    deposit = await create_deposit(session, current_user.id, deposit_in)
    return DepositResponse.model_validate(deposit)


@router.get("/{deposit_id}", response_model=DepositResponse)
async def get_deposit_by_id(
    session: SessionDep,
    current_user: CurrentUser,
    deposit_id: str,
) -> DepositResponse:
    deposit = await get_deposit(session, deposit_id)
    if not deposit or deposit.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Deposit not found"
        )
    return DepositResponse.model_validate(deposit)
