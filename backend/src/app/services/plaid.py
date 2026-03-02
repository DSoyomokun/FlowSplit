"""
Plaid Integration Service
Handles account linking, transaction monitoring, and balance checks

Story 83: Plaid integration architecture
"""

import asyncio
import certifi
import logging
import os
import ssl
from dataclasses import dataclass
from datetime import date, datetime
from enum import Enum
from typing import Any

# Fix macOS SSL certificate issue before importing plaid
os.environ["SSL_CERT_FILE"] = certifi.where()
os.environ["REQUESTS_CA_BUNDLE"] = certifi.where()
ssl._create_default_https_context = lambda: ssl.create_default_context(cafile=certifi.where())

import plaid
from plaid.api import plaid_api
from plaid.model.accounts_balance_get_request import AccountsBalanceGetRequest
from plaid.model.accounts_balance_get_request_options import (
    AccountsBalanceGetRequestOptions,
)
from plaid.model.accounts_get_request import AccountsGetRequest
from plaid.model.country_code import CountryCode
from plaid.model.item_public_token_exchange_request import (
    ItemPublicTokenExchangeRequest,
)
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.products import Products
from plaid.model.transactions_sync_request import TransactionsSyncRequest

from app.core.config import settings


logger = logging.getLogger(__name__)


PLAID_ENV_URLS = {
    "sandbox": plaid.Environment.Sandbox,
    "development": plaid.Environment.Sandbox,  # Use sandbox host for development
    "production": plaid.Environment.Production,
}


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
    Service for Plaid integration using the plaid-python SDK.
    All sync SDK calls are wrapped in asyncio.to_thread().
    """

    def __init__(self):
        self.client: plaid_api.PlaidApi | None = None
        self.environment = PlaidEnvironment.SANDBOX
        self.products = [
            PlaidProductType.TRANSACTIONS,
            PlaidProductType.AUTH,
        ]
        self._init_client()

    def _init_client(self) -> None:
        """Initialize Plaid client with real SDK."""
        if not (settings.plaid_client_id and settings.plaid_secret):
            logger.warning("Plaid credentials not configured")
            return

        try:
            self.environment = PlaidEnvironment(
                settings.plaid_environment or "sandbox"
            )

            configuration = plaid.Configuration(
                host=PLAID_ENV_URLS.get(
                    self.environment.value, plaid.Environment.Sandbox
                ),
                api_key={
                    "clientId": settings.plaid_client_id,
                    "secret": settings.plaid_secret,
                },
                ssl_ca_cert=certifi.where(),
            )

            api_client = plaid.ApiClient(configuration)
            self.client = plaid_api.PlaidApi(api_client)

            logger.info(f"Plaid client initialized ({self.environment.value})")

        except Exception as e:
            logger.error(f"Failed to initialize Plaid: {e}")

    def _ensure_client(self) -> plaid_api.PlaidApi:
        """Raise if client not initialized."""
        if self.client is None:
            raise RuntimeError(
                "Plaid client not initialized. Check credentials in .env"
            )
        return self.client

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
        client = self._ensure_client()
        logger.info(f"Creating link token for user {user_id}")

        request = LinkTokenCreateRequest(
            user=LinkTokenCreateRequestUser(client_user_id=user_id),
            client_name="FlowSplit",
            products=[Products(p.value) for p in self.products],
            country_codes=[CountryCode("US")],
            language="en",
        )
        if redirect_uri:
            request.redirect_uri = redirect_uri

        response = await asyncio.to_thread(client.link_token_create, request)
        return LinkTokenResponse(
            link_token=response.link_token,
            expiration=response.expiration,
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
        client = self._ensure_client()
        logger.info("Exchanging public token")

        request = ItemPublicTokenExchangeRequest(public_token=public_token)
        response = await asyncio.to_thread(
            client.item_public_token_exchange, request
        )
        return (response.access_token, response.item_id)

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
        client = self._ensure_client()
        logger.info("Fetching accounts")

        request = AccountsGetRequest(access_token=access_token)
        response = await asyncio.to_thread(client.accounts_get, request)

        # Try to get institution info
        institution_id = None
        institution_name = None
        if hasattr(response, "item") and response.item:
            institution_id = response.item.institution_id

        return [
            PlaidAccount(
                account_id=a.account_id,
                name=a.name,
                official_name=getattr(a, "official_name", None),
                type=a.type.value if hasattr(a.type, "value") else str(a.type),
                subtype=(
                    a.subtype.value
                    if a.subtype and hasattr(a.subtype, "value")
                    else str(a.subtype) if a.subtype else None
                ),
                mask=a.mask,
                current_balance=(
                    float(a.balances.current) if a.balances.current is not None else None
                ),
                available_balance=(
                    float(a.balances.available) if a.balances.available is not None else None
                ),
                institution_id=institution_id,
                institution_name=institution_name,
            )
            for a in response.accounts
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
        client = self._ensure_client()
        logger.info(f"Syncing transactions (cursor={cursor})")

        kwargs: dict[str, Any] = {"access_token": access_token}
        if cursor:
            kwargs["cursor"] = cursor

        request = TransactionsSyncRequest(**kwargs)
        response = await asyncio.to_thread(client.transactions_sync, request)

        transactions = [
            PlaidTransaction(
                transaction_id=t.transaction_id,
                account_id=t.account_id,
                amount=float(t.amount),
                date=t.date,
                name=t.name,
                merchant_name=getattr(t, "merchant_name", None),
                category=list(t.category) if t.category else [],
                pending=t.pending,
            )
            for t in response.added
        ]

        return (transactions, response.next_cursor)

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
        client = self._ensure_client()
        logger.info("Fetching balances")

        kwargs: dict[str, Any] = {"access_token": access_token}
        if account_ids:
            kwargs["options"] = AccountsBalanceGetRequestOptions(
                account_ids=account_ids
            )

        request = AccountsBalanceGetRequest(**kwargs)
        response = await asyncio.to_thread(client.accounts_balance_get, request)

        return {
            a.account_id: float(a.balances.available)
            for a in response.accounts
            if a.balances.available is not None
        }

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
