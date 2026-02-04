"""
Split Execution Service
Handles the execution of split plans with support for partial failures

Story 81: Implement split execution service
"""

import asyncio
import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import (
    complete_split_plan,
    execute_split_plan,
    get_split_plan,
    mark_action_executed,
)
from app.models.deposit import Deposit, DepositStatus
from app.models.split_plan import SplitAction, SplitPlan, SplitPlanStatus
from app.services.notification import notification_service
from app.services.transfer import transfer_service, TransferResult


logger = logging.getLogger(__name__)


class ActionStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    MANUAL_REQUIRED = "manual_required"


@dataclass
class ActionExecutionResult:
    """Result of executing a single split action."""
    action_id: str
    bucket_id: str
    status: ActionStatus
    amount: float
    error: str | None = None
    external_url: str | None = None  # For manual actions (e.g., Pushpay link)
    transaction_id: str | None = None


@dataclass
class SplitExecutionResult:
    """Result of executing an entire split plan."""
    plan_id: str
    status: str
    total_amount: float
    completed_amount: float
    failed_amount: float
    manual_amount: float
    action_results: list[ActionExecutionResult]
    completed_at: datetime | None = None

    @property
    def is_complete(self) -> bool:
        return all(
            r.status in (ActionStatus.COMPLETED, ActionStatus.MANUAL_REQUIRED)
            for r in self.action_results
        )

    @property
    def has_failures(self) -> bool:
        return any(r.status == ActionStatus.FAILED for r in self.action_results)

    @property
    def requires_manual_action(self) -> bool:
        return any(r.status == ActionStatus.MANUAL_REQUIRED for r in self.action_results)


class SplitExecutionService:
    """
    Service for executing split plans.

    Handles:
    - Processing each action in a split plan
    - Managing partial failures
    - Tracking execution status
    - Triggering notifications
    """

    def __init__(self):
        self.max_retries = 3
        self.retry_delay_seconds = 2

    async def execute_plan(
        self,
        session: AsyncSession,
        plan: SplitPlan,
        deposit: Deposit,
        user_phone: str | None = None,
    ) -> SplitExecutionResult:
        """
        Execute a split plan by processing each action.

        Args:
            session: Database session
            plan: The split plan to execute
            deposit: The deposit being split
            user_phone: User's phone for notifications

        Returns:
            SplitExecutionResult with status of all actions
        """
        logger.info(f"Starting execution of split plan {plan.id}")

        # Update plan status to executing
        await execute_split_plan(session, plan)

        # Update deposit status
        deposit.status = DepositStatus.PROCESSING.value
        await session.flush()

        action_results: list[ActionExecutionResult] = []
        completed_amount = 0.0
        failed_amount = 0.0
        manual_amount = 0.0

        # Execute each action
        for action in plan.actions:
            result = await self._execute_action(session, action, deposit)
            action_results.append(result)

            if result.status == ActionStatus.COMPLETED:
                completed_amount += result.amount
            elif result.status == ActionStatus.FAILED:
                failed_amount += result.amount
            elif result.status == ActionStatus.MANUAL_REQUIRED:
                manual_amount += result.amount

        # Determine final plan status
        all_complete = all(
            r.status in (ActionStatus.COMPLETED, ActionStatus.MANUAL_REQUIRED)
            for r in action_results
        )

        if all_complete:
            await complete_split_plan(session, plan)
            deposit.status = DepositStatus.COMPLETED.value
            deposit.processed_at = datetime.now(timezone.utc)
        else:
            # Partial failure - keep in executing state for retry
            deposit.status = DepositStatus.PROCESSING.value

        await session.flush()
        await session.commit()

        result = SplitExecutionResult(
            plan_id=plan.id,
            status=plan.status,
            total_amount=float(plan.total_amount),
            completed_amount=completed_amount,
            failed_amount=failed_amount,
            manual_amount=manual_amount,
            action_results=action_results,
            completed_at=plan.executed_at,
        )

        # Send notifications
        await self._send_completion_notification(
            result, user_phone, len(plan.actions)
        )

        logger.info(
            f"Completed execution of split plan {plan.id}: "
            f"completed={completed_amount}, failed={failed_amount}, manual={manual_amount}"
        )

        return result

    async def _execute_action(
        self,
        session: AsyncSession,
        action: SplitAction,
        deposit: Deposit,
    ) -> ActionExecutionResult:
        """Execute a single split action with retry logic."""
        amount = float(action.amount)

        for attempt in range(self.max_retries):
            try:
                # Get bucket details for transfer
                bucket = action.bucket

                # Check if this is a manual action bucket (e.g., tithe to external service)
                if bucket and self._requires_manual_action(bucket):
                    external_url = await transfer_service.generate_external_link(
                        bucket_id=bucket.id,
                        amount=amount,
                        deposit_id=deposit.id,
                    )
                    return ActionExecutionResult(
                        action_id=action.id,
                        bucket_id=action.bucket_id,
                        status=ActionStatus.MANUAL_REQUIRED,
                        amount=amount,
                        external_url=external_url,
                    )

                # Execute bank transfer
                transfer_result = await transfer_service.execute_transfer(
                    bucket_id=action.bucket_id,
                    amount=amount,
                    deposit_id=deposit.id,
                )

                if transfer_result.success:
                    await mark_action_executed(session, action)
                    return ActionExecutionResult(
                        action_id=action.id,
                        bucket_id=action.bucket_id,
                        status=ActionStatus.COMPLETED,
                        amount=amount,
                        transaction_id=transfer_result.transaction_id,
                    )
                else:
                    # Transfer failed, will retry
                    logger.warning(
                        f"Transfer failed for action {action.id}, "
                        f"attempt {attempt + 1}/{self.max_retries}: {transfer_result.error}"
                    )

            except Exception as e:
                logger.error(f"Error executing action {action.id}: {e}")

            # Wait before retry
            if attempt < self.max_retries - 1:
                await asyncio.sleep(self.retry_delay_seconds * (attempt + 1))

        # All retries exhausted
        return ActionExecutionResult(
            action_id=action.id,
            bucket_id=action.bucket_id,
            status=ActionStatus.FAILED,
            amount=amount,
            error="Transfer failed after maximum retries",
        )

    def _requires_manual_action(self, bucket: Any) -> bool:
        """Check if a bucket requires manual action (external transfer)."""
        # Buckets with external delivery methods require manual action
        # This would be determined by bucket configuration
        # For now, check if bucket has an external_url configured
        return getattr(bucket, 'external_url', None) is not None

    async def _send_completion_notification(
        self,
        result: SplitExecutionResult,
        phone: str | None,
        bucket_count: int,
    ) -> None:
        """Send appropriate notification based on execution result."""
        if not phone:
            return

        try:
            if result.is_complete and not result.has_failures:
                if result.requires_manual_action:
                    await notification_service.notify_manual_action_required(
                        phone, result.manual_amount
                    )
                else:
                    await notification_service.notify_split_completed(
                        phone, result.total_amount, bucket_count
                    )
            elif result.has_failures:
                await notification_service.notify_split_partial_failure(
                    phone, result.completed_amount, result.failed_amount
                )
        except Exception as e:
            logger.error(f"Failed to send notification: {e}")

    async def retry_failed_actions(
        self,
        session: AsyncSession,
        plan_id: str,
    ) -> SplitExecutionResult:
        """Retry any failed actions in a split plan."""
        plan = await get_split_plan(session, plan_id)
        if not plan:
            raise ValueError(f"Split plan {plan_id} not found")

        # Find failed actions (not executed)
        failed_actions = [a for a in plan.actions if not a.executed]

        if not failed_actions:
            return SplitExecutionResult(
                plan_id=plan.id,
                status=plan.status,
                total_amount=float(plan.total_amount),
                completed_amount=float(plan.total_amount),
                failed_amount=0.0,
                manual_amount=0.0,
                action_results=[],
            )

        # Re-execute failed actions
        action_results: list[ActionExecutionResult] = []
        completed_amount = sum(float(a.amount) for a in plan.actions if a.executed)
        failed_amount = 0.0
        manual_amount = 0.0

        deposit = plan.deposit

        for action in failed_actions:
            result = await self._execute_action(session, action, deposit)
            action_results.append(result)

            if result.status == ActionStatus.COMPLETED:
                completed_amount += result.amount
            elif result.status == ActionStatus.FAILED:
                failed_amount += result.amount
            elif result.status == ActionStatus.MANUAL_REQUIRED:
                manual_amount += result.amount

        # Check if all complete now
        all_executed = all(a.executed for a in plan.actions)
        if all_executed:
            await complete_split_plan(session, plan)
            deposit.status = DepositStatus.COMPLETED.value
            deposit.processed_at = datetime.now(timezone.utc)
            await session.flush()

        await session.commit()

        return SplitExecutionResult(
            plan_id=plan.id,
            status=plan.status,
            total_amount=float(plan.total_amount),
            completed_amount=completed_amount,
            failed_amount=failed_amount,
            manual_amount=manual_amount,
            action_results=action_results,
        )


# Global service instance
split_execution_service = SplitExecutionService()
