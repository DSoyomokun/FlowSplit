"""
Plaid Integration Service
Handles account linking, transaction monitoring, and balance checks

Story 83: Plaid integration architecture
"""

import logging
from dataclasses import dataclass
from datetime import date, datetime
from enum import Enum
from typing import Any

from app.core.config import settings


logger = logging.getLogger(__name__)


class PlaidEnvironment(str, Enum):
    """Plaid API environments."""
    SANDBOX = "sandbox"
    DEVELOPMENT = "development"
    PRODUCTION = "production"


class PlaidProductType(str, Enum):
    """Plaid product types used by FlowSplit."""
    TRANSACTIONS = "transactions"
    AUTH = "auth"
    IDENTITY = "identity"
    BALANCE = "balance"
    TRANSFER = "transfer"


@dataclass
class PlaidAccount:
    """Representation of a linked Plaid account."""
    account_id: str
    name: str
    official_name: str | None
    type: str  # depository, credit, loan, etc.
    subtype: str | None  # checking, savings, etc.
    mask: str  # Last 4 digits
    current_balance: float | None
    available_balance: float | None
    institution_id: str | None
    institution_name: str | None


@dataclass
class PlaidTransaction:
    """Representation of a Plaid transaction."""
    transaction_id: str
    account_id: str
    amount: float  # Positive = debit, Negative = credit (deposit)
    date: date
    name: str
    merchant_name: str | None
    category: list[str]
    pending: bool


@dataclass
class LinkTokenResponse:
    """Response from creating a Plaid Link token."""
    link_token: str
    expiration: datetime


class PlaidService:
    """
    Service for Plaid integration.

    Architecture:
    ┌──────────────────────────────────────────────────────────────┐
    │                      FlowSplit App                          │
    │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
    │  │ Account     │    │ Transaction │    │ Transfer    │     │
    │  │ Linking     │    │ Monitoring  │    │ Execution   │     │
    │  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘     │
    └─────────┼──────────────────┼──────────────────┼────────────┘
              │                  │                  │
              ▼                  ▼                  ▼
    ┌─────────────────────────────────────────────────────────────┐
    │                     Plaid API                               │
    │  ┌─────────┐  ┌─────────────┐  ┌─────────┐  ┌─────────────┐│
    │  │ Link    │  │ Transactions│  │ Balance │  │ Transfer    ││
    │  └─────────┘  └─────────────┘  └─────────┘  └─────────────┘│
    └─────────────────────────────────────────────────────────────┘

    Webhook Flow:
    1. User links account via Plaid Link
    2. We receive ITEM_LOGIN_REQUIRED or TRANSACTIONS_SYNC webhooks
    3. On new transaction, check if it's a deposit
    4. Create Deposit record and notify user
    5. User approves split plan
    6. Execute transfers via Plaid Transfer API
    """

    def __init__(self):
        self.client: Any = None
        self.environment = PlaidEnvironment.SANDBOX
        self.products = [
            PlaidProductType.TRANSACTIONS,
            PlaidProductType.AUTH,
            PlaidProductType.TRANSFER,
        ]
        self._init_client()

    def _init_client(self) -> None:
        """Initialize Plaid client."""
        if not (settings.plaid_client_id and settings.plaid_secret):
            logger.warning("Plaid credentials not configured")
            return

        try:
            # In production, use official plaid-python client:
            # from plaid.api import plaid_api
            # from plaid.model import *
            # configuration = plaid.Configuration(...)
            # self.client = plaid_api.PlaidApi(plaid.ApiClient(configuration))

            self.environment = PlaidEnvironment(
                settings.plaid_environment or "sandbox"
            )
            logger.info(f"Plaid client initialized ({self.environment.value})")

        except Exception as e:
            logger.error(f"Failed to initialize Plaid: {e}")

    # -------------------------------------------------------------------------
    # Account Linking
    # -------------------------------------------------------------------------

    async def create_link_token(
        self,
        user_id: str,
        redirect_uri: str | None = None,
    ) -> LinkTokenResponse:
        """
        Create a Plaid Link token for account connection.

        Args:
            user_id: FlowSplit user ID
            redirect_uri: OAuth redirect URI (for OAuth institutions)

        Returns:
            LinkTokenResponse with token and expiration
        """
        logger.info(f"Creating link token for user {user_id}")

        # In production:
        # request = LinkTokenCreateRequest(
        #     user=LinkTokenCreateRequestUser(client_user_id=user_id),
        #     client_name="FlowSplit",
        #     products=[p.value for p in self.products],
        #     country_codes=[CountryCode("US")],
        #     language="en",
        #     redirect_uri=redirect_uri,
        # )
        # response = self.client.link_token_create(request)
        # return LinkTokenResponse(
        #     link_token=response.link_token,
        #     expiration=response.expiration,
        # )

        # Sandbox placeholder
        return LinkTokenResponse(
            link_token="link-sandbox-placeholder",
            expiration=datetime.utcnow(),
        )

    async def exchange_public_token(
        self,
        public_token: str,
    ) -> tuple[str, str]:
        """
        Exchange a public token for an access token.

        Called after user completes Plaid Link flow.

        Args:
            public_token: Public token from Plaid Link

        Returns:
            Tuple of (access_token, item_id)
        """
        logger.info("Exchanging public token")

        # In production:
        # request = ItemPublicTokenExchangeRequest(public_token=public_token)
        # response = self.client.item_public_token_exchange(request)
        # return (response.access_token, response.item_id)

        # Sandbox placeholder
        return ("access-sandbox-placeholder", "item-sandbox-placeholder")

    async def get_accounts(
        self,
        access_token: str,
    ) -> list[PlaidAccount]:
        """
        Get all accounts for a linked item.

        Args:
            access_token: Plaid access token

        Returns:
            List of PlaidAccount objects
        """
        logger.info("Fetching accounts")

        # In production:
        # request = AccountsGetRequest(access_token=access_token)
        # response = self.client.accounts_get(request)
        # return [self._map_account(a) for a in response.accounts]

        # Sandbox placeholder
        return [
            PlaidAccount(
                account_id="acc_sandbox_checking",
                name="Checking",
                official_name="Primary Checking",
                type="depository",
                subtype="checking",
                mask="1234",
                current_balance=5000.00,
                available_balance=4500.00,
                institution_id="ins_1",
                institution_name="Sandbox Bank",
            ),
        ]

    # -------------------------------------------------------------------------
    # Transaction Monitoring
    # -------------------------------------------------------------------------

    async def sync_transactions(
        self,
        access_token: str,
        cursor: str | None = None,
    ) -> tuple[list[PlaidTransaction], str]:
        """
        Sync transactions using Plaid's sync endpoint.

        Uses cursor-based pagination for efficient updates.

        Args:
            access_token: Plaid access token
            cursor: Previous sync cursor (None for initial sync)

        Returns:
            Tuple of (transactions, new_cursor)
        """
        logger.info(f"Syncing transactions (cursor={cursor})")

        # In production:
        # request = TransactionsSyncRequest(
        #     access_token=access_token,
        #     cursor=cursor,
        # )
        # response = self.client.transactions_sync(request)
        # return (
        #     [self._map_transaction(t) for t in response.added],
        #     response.next_cursor,
        # )

        # Sandbox placeholder
        return ([], cursor or "cursor_0")

    async def get_balance(
        self,
        access_token: str,
        account_ids: list[str] | None = None,
    ) -> dict[str, float]:
        """
        Get current balance for accounts.

        Args:
            access_token: Plaid access token
            account_ids: Optional filter for specific accounts

        Returns:
            Dict of account_id -> available_balance
        """
        logger.info("Fetching balances")

        # In production:
        # request = AccountsBalanceGetRequest(
        #     access_token=access_token,
        #     options=AccountsBalanceGetRequestOptions(account_ids=account_ids),
        # )
        # response = self.client.accounts_balance_get(request)
        # return {
        #     a.account_id: a.balances.available
        #     for a in response.accounts
        # }

        # Sandbox placeholder
        return {"acc_sandbox_checking": 4500.00}

    # -------------------------------------------------------------------------
    # Webhook Handlers
    # -------------------------------------------------------------------------

    async def handle_webhook(
        self,
        webhook_type: str,
        webhook_code: str,
        item_id: str,
        payload: dict[str, Any],
    ) -> None:
        """
        Handle incoming Plaid webhook.

        Key webhook types:
        - TRANSACTIONS: SYNC_UPDATES_AVAILABLE, DEFAULT_UPDATE
        - ITEM: PENDING_EXPIRATION, LOGIN_REQUIRED
        - TRANSFER: TRANSFER_EVENTS_UPDATE
        """
        logger.info(f"Webhook received: {webhook_type}/{webhook_code} for {item_id}")

        if webhook_type == "TRANSACTIONS":
            if webhook_code in ("SYNC_UPDATES_AVAILABLE", "DEFAULT_UPDATE"):
                # New transactions available - trigger sync
                # await self._process_new_transactions(item_id)
                pass

        elif webhook_type == "ITEM":
            if webhook_code == "LOGIN_REQUIRED":
                # User needs to re-authenticate
                # await self._notify_reauth_required(item_id)
                pass

        elif webhook_type == "TRANSFER":
            if webhook_code == "TRANSFER_EVENTS_UPDATE":
                # Transfer status changed
                # await self._process_transfer_update(payload)
                pass

    # -------------------------------------------------------------------------
    # Deposit Detection
    # -------------------------------------------------------------------------

    def is_deposit_transaction(self, transaction: PlaidTransaction) -> bool:
        """
        Determine if a transaction is a deposit that should be split.

        Criteria:
        - Negative amount (credit to account)
        - Not pending
        - Above minimum threshold
        - Matches deposit categories (payroll, transfer, etc.)
        """
        # Deposits appear as negative amounts in Plaid
        if transaction.amount >= 0:
            return False

        if transaction.pending:
            return False

        # Minimum deposit threshold (configurable)
        min_deposit = 10.00
        if abs(transaction.amount) < min_deposit:
            return False

        # Check category for deposit-like transactions
        deposit_categories = {
            "Transfer",
            "Payroll",
            "Direct Deposit",
            "Income",
            "Dividend",
        }
        if any(cat in deposit_categories for cat in transaction.category):
            return True

        return False


# Global service instance
plaid_service = PlaidService()
