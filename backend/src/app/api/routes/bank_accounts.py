import logging

from fastapi import APIRouter, HTTPException, status
from plaid.exceptions import ApiException as PlaidApiException

from app.api.deps import CurrentUser
from app.core.database import SessionDep
from app.crud import (
    create_bank_account,
    deactivate_bank_account,
    get_bank_account,
    get_bank_account_by_plaid_account_id,
    get_bank_accounts_by_user,
    set_primary_bank_account,
    update_bank_account,
)
from app.schemas.bank_account import (
    BankAccountCreate,
    BankAccountResponse,
    BankAccountUpdate,
    LinkTokenRequest,
    LinkTokenResponse,
    PublicTokenExchangeRequest,
)
from app.services.plaid import plaid_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/bank-accounts", tags=["bank-accounts"])


@router.post("/link-token", response_model=LinkTokenResponse)
async def create_link_token(
    current_user: CurrentUser,
    body: LinkTokenRequest | None = None,
) -> LinkTokenResponse:
    """Create a Plaid Link token to initiate account linking."""
    try:
        redirect_uri = body.redirect_uri if body else None
        result = await plaid_service.create_link_token(
            user_id=current_user.id,
            redirect_uri=redirect_uri,
        )
        return LinkTokenResponse(
            link_token=result.link_token,
            expiration=result.expiration,
        )
    except PlaidApiException as e:
        logger.error(f"Plaid link token error: {e.body}")
        raise HTTPException(status_code=400, detail=f"Plaid error: {e.body}")
    except Exception as e:
        logger.error(f"Link token error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/exchange-token",
    response_model=list[BankAccountResponse],
    status_code=status.HTTP_201_CREATED,
)
async def exchange_public_token(
    session: SessionDep,
    current_user: CurrentUser,
    body: PublicTokenExchangeRequest,
) -> list[BankAccountResponse]:
    """
    Exchange a Plaid public token, fetch accounts, and save them.
    Returns the list of newly linked bank accounts.
    """
    # Exchange public token for access token
    access_token, item_id = await plaid_service.exchange_public_token(
        body.public_token
    )

    # Fetch accounts from Plaid
    plaid_accounts = await plaid_service.get_accounts(access_token)

    created = []
    for pa in plaid_accounts:
        # Skip if already linked
        existing = await get_bank_account_by_plaid_account_id(
            session, pa.account_id
        )
        if existing:
            logger.info(f"Account {pa.account_id} already linked, skipping")
            continue

        account_in = BankAccountCreate(
            plaid_item_id=item_id,
            plaid_account_id=pa.account_id,
            plaid_access_token=access_token,
            institution_id=body.institution_id or pa.institution_id,
            institution_name=body.institution_name or pa.institution_name,
            name=pa.name,
            official_name=pa.official_name,
            type=pa.type,
            subtype=pa.subtype,
            mask=pa.mask or "",
        )
        bank_account = await create_bank_account(
            session, current_user.id, account_in
        )
        created.append(bank_account)

    # If this is the user's first account, set it as primary
    all_accounts = await get_bank_accounts_by_user(session, current_user.id)
    if len(all_accounts) == len(created) and created:
        await set_primary_bank_account(session, current_user.id, created[0].id)

    return [BankAccountResponse.model_validate(a) for a in created]


@router.get("", response_model=list[BankAccountResponse])
async def list_bank_accounts(
    session: SessionDep,
    current_user: CurrentUser,
) -> list[BankAccountResponse]:
    """List all active bank accounts for the current user."""
    accounts = await get_bank_accounts_by_user(session, current_user.id)
    return [BankAccountResponse.model_validate(a) for a in accounts]


@router.get("/{bank_account_id}", response_model=BankAccountResponse)
async def get_bank_account_by_id(
    session: SessionDep,
    current_user: CurrentUser,
    bank_account_id: str,
) -> BankAccountResponse:
    """Get a single bank account by ID."""
    account = await get_bank_account(session, bank_account_id)
    if not account or account.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bank account not found",
        )
    return BankAccountResponse.model_validate(account)


@router.patch("/{bank_account_id}", response_model=BankAccountResponse)
async def update_bank_account_by_id(
    session: SessionDep,
    current_user: CurrentUser,
    bank_account_id: str,
    account_in: BankAccountUpdate,
) -> BankAccountResponse:
    """Update a bank account (name or primary status)."""
    account = await get_bank_account(session, bank_account_id)
    if not account or account.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bank account not found",
        )

    # If setting as primary, use dedicated function
    if account_in.is_primary is True:
        account = await set_primary_bank_account(
            session, current_user.id, bank_account_id
        )
        # Also update name if provided
        if account_in.name is not None:
            account_in_name_only = BankAccountUpdate(name=account_in.name)
            account = await update_bank_account(session, account, account_in_name_only)
    else:
        account = await update_bank_account(session, account, account_in)

    return BankAccountResponse.model_validate(account)


@router.delete("/{bank_account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bank_account_by_id(
    session: SessionDep,
    current_user: CurrentUser,
    bank_account_id: str,
) -> None:
    """Soft-delete (deactivate) a bank account."""
    account = await get_bank_account(session, bank_account_id)
    if not account or account.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bank account not found",
        )
    await deactivate_bank_account(session, account)
