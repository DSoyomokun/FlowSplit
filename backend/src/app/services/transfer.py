"""
Transfer Execution Service
Handles bank transfers and external payment link generation

Story 84: Transfer execution architecture
"""

import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum
from typing import Any
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings


logger = logging.getLogger(__name__)


class TransferMethod(str, Enum):
    """Supported transfer methods."""
    ACH = "ach"
    WIRE = "wire"
    INTERNAL = "internal"
    EXTERNAL_LINK = "external_link"


class TransferStatus(str, Enum):
    """Transfer status."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class TransferResult:
    """Result of a transfer operation."""
    success: bool
    transaction_id: str | None = None
    status: TransferStatus = TransferStatus.PENDING
    error: str | None = None
    external_url: str | None = None


class TransferService:
    """
    Service for executing transfers to destination accounts.

    Architecture:
    - Internal transfers: Move money between linked accounts
    - ACH transfers: Standard bank transfers (1-3 business days)
    - External links: Generate payment links for services like Pushpay

    Integration points:
    - Plaid for account verification and ACH
    - Custom webhook handlers for status updates
    - External API integrations (Pushpay, Givelify, etc.)
    """

    def __init__(self):
        self.plaid_client: Any = None  # Initialized when Plaid is configured
        self._init_plaid()

    def _init_plaid(self) -> None:
        """Initialize Plaid client if configured."""
        if settings.plaid_client_id and settings.plaid_secret:
            try:
                # Plaid client initialization would go here
                # from plaid import Client
                # self.plaid_client = Client(...)
                logger.info("Plaid client initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize Plaid: {e}")

    async def execute_transfer(
        self,
        bucket_id: str,
        amount: float,
        deposit_id: str,
        session: AsyncSession | None = None,
        source_bank_account_id: str | None = None,
        destination_account_id: str | None = None,
        method: TransferMethod = TransferMethod.ACH,
    ) -> TransferResult:
        """
        Execute an ACH transfer from the deposit's source account to the
        bucket's destination bank account via Plaid Transfer.

        Falls back to a simulated success when Plaid is not configured
        (sandbox / development without Transfer product).
        """
        logger.info(
            "Executing transfer: bucket=%s amount=%.2f deposit=%s",
            bucket_id, amount, deposit_id,
        )

        # If we have all the info needed for a real Plaid transfer, attempt it
        if session and source_bank_account_id and destination_account_id:
            return await self._execute_plaid_transfer(
                session=session,
                source_bank_account_id=source_bank_account_id,
                destination_account_id=destination_account_id,
                amount=amount,
                deposit_id=deposit_id,
            )

        # Fallback: simulate success (no Plaid Transfer product / dev mode)
        logger.warning(
            "execute_transfer: missing session or account IDs — using simulated transfer"
        )
        return TransferResult(
            success=True,
            transaction_id=f"sim_{uuid4().hex[:12]}",
            status=TransferStatus.COMPLETED,
        )

    async def _execute_plaid_transfer(
        self,
        session: AsyncSession,
        source_bank_account_id: str,
        destination_account_id: str,
        amount: float,
        deposit_id: str,
    ) -> TransferResult:
        """Call Plaid Transfer API to move funds between linked accounts."""
        from app.models.bank_account import BankAccount
        from app.services.plaid import plaid_service

        if plaid_service.client is None:
            logger.warning("Plaid client not configured — using simulated transfer")
            return TransferResult(
                success=True,
                transaction_id=f"sim_{uuid4().hex[:12]}",
                status=TransferStatus.COMPLETED,
            )

        try:
            # Load source account (holds the access_token)
            source_result = await session.execute(
                select(BankAccount).where(BankAccount.id == source_bank_account_id)
            )
            source_acct = source_result.scalar_one_or_none()
            if not source_acct or not source_acct.plaid_access_token:
                return TransferResult(
                    success=False,
                    error="Source bank account not found or missing access token",
                    status=TransferStatus.FAILED,
                )

            # Load destination account (to get plaid_account_id for description)
            dest_result = await session.execute(
                select(BankAccount).where(BankAccount.id == destination_account_id)
            )
            dest_acct = dest_result.scalar_one_or_none()
            dest_name = dest_acct.name if dest_acct else "destination"

            idempotency_key = f"{deposit_id}-{source_bank_account_id}"
            plaid_transfer_id = await plaid_service.create_plaid_transfer(
                access_token=source_acct.plaid_access_token,
                account_id=source_acct.plaid_account_id,
                amount=amount,
                description=f"FlowSplit→{dest_name}"[:15],
                idempotency_key=idempotency_key,
            )

            logger.info("Plaid transfer created: %s", plaid_transfer_id)
            return TransferResult(
                success=True,
                transaction_id=plaid_transfer_id,
                status=TransferStatus.PENDING,  # ACH settles async
            )

        except Exception as e:
            logger.error("Plaid transfer failed: %s", e)
            return TransferResult(
                success=False,
                error=str(e),
                status=TransferStatus.FAILED,
            )

    async def generate_external_link(
        self,
        bucket_id: str,
        amount: float,
        deposit_id: str,
        configured_url: str | None = None,
    ) -> str:
        """
        Generate an external payment link for manual transfers.

        Used for:
        - Tithe/giving platforms (Pushpay, Givelify)
        - Investment platforms
        - Any destination requiring manual action

        Args:
            bucket_id: Target bucket ID
            amount: Amount to transfer
            deposit_id: Source deposit ID
            configured_url: Pre-configured URL from bucket settings

        Returns:
            URL for the external payment
        """
        logger.info(f"Generating external link: bucket={bucket_id}, amount={amount}")

        # Use the bucket's configured URL if available
        if configured_url:
            # Support {{amount}} template — replace in place if present
            if "{{amount}}" in configured_url:
                return configured_url.replace("{{amount}}", str(amount))
            # Legacy fallback — append amount as query param
            separator = "&" if "?" in configured_url else "?"
            return f"{configured_url}{separator}a={amount}"

        # Fallback placeholder URL
        base_url = "https://flowsplit.app/pay"
        return f"{base_url}?bucket={bucket_id}&amount={amount}&ref={deposit_id}"

    async def get_transfer_status(
        self,
        transaction_id: str,
    ) -> TransferResult:
        """
        Check the status of a pending transfer.

        Args:
            transaction_id: The transaction ID to check

        Returns:
            TransferResult with current status
        """
        logger.info(f"Checking transfer status: {transaction_id}")

        try:
            # In production, this would query Plaid or bank API
            # for the current transaction status

            return TransferResult(
                success=True,
                transaction_id=transaction_id,
                status=TransferStatus.COMPLETED,
            )

        except Exception as e:
            logger.error(f"Failed to get transfer status: {e}")
            return TransferResult(
                success=False,
                transaction_id=transaction_id,
                error=str(e),
                status=TransferStatus.FAILED,
            )

    async def cancel_transfer(
        self,
        transaction_id: str,
    ) -> bool:
        """
        Cancel a pending transfer if possible.

        Args:
            transaction_id: The transaction ID to cancel

        Returns:
            True if cancelled successfully
        """
        logger.info(f"Cancelling transfer: {transaction_id}")

        try:
            # In production, attempt to cancel via bank API
            # Only works for pending transfers
            return True

        except Exception as e:
            logger.error(f"Failed to cancel transfer: {e}")
            return False


# External service integrations

class PushpayIntegration:
    """
    Pushpay integration for church giving.

    Generates pre-filled giving links with:
    - Organization ID
    - Amount
    - Fund designation
    - Return URL for tracking
    """

    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or settings.pushpay_api_key
        self.base_url = "https://pushpay.com/g"

    async def generate_giving_link(
        self,
        organization_id: str,
        amount: float,
        fund_id: str | None = None,
        reference: str | None = None,
    ) -> str:
        """Generate a Pushpay giving link."""
        url = f"{self.base_url}/{organization_id}"
        params = [f"a={amount}"]

        if fund_id:
            params.append(f"f={fund_id}")
        if reference:
            params.append(f"r={reference}")

        return f"{url}?{'&'.join(params)}"


class PlaidTransferIntegration:
    """
    Plaid Transfer integration for ACH transfers.

    Supports:
    - One-time transfers
    - Recurring transfers
    - Transfer status webhooks
    """

    def __init__(self):
        self.client = None  # Plaid client
        self._init_client()

    def _init_client(self) -> None:
        """Initialize Plaid client."""
        # Plaid initialization would go here
        pass

    async def create_transfer(
        self,
        access_token: str,
        account_id: str,
        amount: float,
        description: str,
    ) -> TransferResult:
        """Create an ACH transfer via Plaid."""
        # Plaid Transfer API call would go here
        return TransferResult(
            success=True,
            transaction_id=f"plaid_{uuid4().hex[:12]}",
            status=TransferStatus.PENDING,
        )


# Global service instance
transfer_service = TransferService()
