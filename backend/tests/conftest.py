"""
Shared test fixtures for FlowSplit backend tests.
"""

from unittest.mock import MagicMock

import pytest

from app.models.bucket import BucketType


def make_bucket(id: str, bucket_type: BucketType, value: float) -> MagicMock:
    """Create a mock Bucket with the given type and allocation value."""
    b = MagicMock()
    b.id = id
    b.bucket_type = bucket_type.value
    b.allocation_value = value
    b.destination_type = "internal_transfer"
    b.external_url = None
    return b


def make_action_result(
    bucket_id: str,
    status: str,
    amount: float,
    external_url: str | None = None,
) -> MagicMock:
    """Create a mock ActionExecutionResult."""
    from app.services.split_execution import ActionExecutionResult, ActionStatus
    return ActionExecutionResult(
        action_id=f"action-{bucket_id}",
        bucket_id=bucket_id,
        status=ActionStatus(status),
        amount=amount,
        external_url=external_url,
    )
