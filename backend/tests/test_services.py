"""
Tests for split execution result properties and transfer service (Story 097).

These test pure logic that doesn't require a database connection.
"""

import pytest

from app.services.split_execution import (
    ActionExecutionResult,
    ActionStatus,
    SplitExecutionResult,
    SplitExecutionService,
)
from app.services.transfer import TransferService
from tests.conftest import make_action_result


# ── SplitExecutionResult properties ──────────────────────────────────────────

def _make_result(action_statuses: list[str], total: float = 1000.0) -> SplitExecutionResult:
    """Helper to build a SplitExecutionResult from a list of status strings."""
    actions = [
        make_action_result(f"bucket-{i}", status, total / len(action_statuses))
        for i, status in enumerate(action_statuses)
    ]
    completed = sum(a.amount for a in actions if a.status == ActionStatus.COMPLETED)
    failed = sum(a.amount for a in actions if a.status == ActionStatus.FAILED)
    manual = sum(a.amount for a in actions if a.status == ActionStatus.MANUAL_REQUIRED)
    return SplitExecutionResult(
        plan_id="plan-1",
        status="completed",
        total_amount=total,
        completed_amount=completed,
        failed_amount=failed,
        manual_amount=manual,
        action_results=actions,
    )


class TestSplitExecutionResultProperties:
    def test_is_complete_all_completed(self):
        result = _make_result(["completed", "completed"])
        assert result.is_complete is True

    def test_is_complete_all_manual(self):
        result = _make_result(["manual_required", "manual_required"])
        assert result.is_complete is True

    def test_is_complete_mixed_completed_and_manual(self):
        result = _make_result(["completed", "manual_required"])
        assert result.is_complete is True

    def test_is_complete_false_when_any_failed(self):
        result = _make_result(["completed", "failed"])
        assert result.is_complete is False

    def test_is_complete_false_when_pending(self):
        result = _make_result(["completed", "pending"])
        assert result.is_complete is False

    def test_has_failures_true(self):
        result = _make_result(["completed", "failed"])
        assert result.has_failures is True

    def test_has_failures_false_all_completed(self):
        result = _make_result(["completed", "completed"])
        assert result.has_failures is False

    def test_has_failures_false_manual_only(self):
        result = _make_result(["manual_required"])
        assert result.has_failures is False

    def test_requires_manual_action_true(self):
        result = _make_result(["completed", "manual_required"])
        assert result.requires_manual_action is True

    def test_requires_manual_action_false(self):
        result = _make_result(["completed", "completed"])
        assert result.requires_manual_action is False

    def test_empty_actions_is_complete(self):
        result = SplitExecutionResult(
            plan_id="p",
            status="completed",
            total_amount=0.0,
            completed_amount=0.0,
            failed_amount=0.0,
            manual_amount=0.0,
            action_results=[],
        )
        assert result.is_complete is True
        assert result.has_failures is False
        assert result.requires_manual_action is False


# ── SplitExecutionService._requires_manual_action ────────────────────────────

class TestRequiresManualAction:
    def setup_method(self):
        self.service = SplitExecutionService()

    def test_external_link_destination_requires_manual(self):
        from unittest.mock import MagicMock
        from app.models.bucket import DeliveryMethod
        bucket = MagicMock()
        bucket.destination_type = DeliveryMethod.EXTERNAL_LINK.value
        bucket.external_url = None
        assert self.service._requires_manual_action(bucket) is True

    def test_external_url_set_requires_manual(self):
        from unittest.mock import MagicMock
        bucket = MagicMock()
        bucket.destination_type = "internal_transfer"
        bucket.external_url = "https://pushpay.com/g/org"
        assert self.service._requires_manual_action(bucket) is True

    def test_internal_transfer_no_url_not_manual(self):
        from unittest.mock import MagicMock
        bucket = MagicMock()
        bucket.destination_type = "internal_transfer"
        bucket.external_url = None
        assert self.service._requires_manual_action(bucket) is False


# ── TransferService.generate_external_link ───────────────────────────────────

class TestGenerateExternalLink:
    def setup_method(self):
        self.service = TransferService()

    @pytest.mark.asyncio
    async def test_amount_template_replaced(self):
        url = await self.service.generate_external_link(
            bucket_id="b1",
            amount=120.0,
            deposit_id="d1",
            configured_url="https://pushpay.com/g/org?a={{amount}}",
        )
        assert url == "https://pushpay.com/g/org?a=120.0"
        assert "{{amount}}" not in url

    @pytest.mark.asyncio
    async def test_legacy_url_gets_amount_appended(self):
        url = await self.service.generate_external_link(
            bucket_id="b1",
            amount=50.0,
            deposit_id="d1",
            configured_url="https://pushpay.com/g/org",
        )
        assert "a=50.0" in url

    @pytest.mark.asyncio
    async def test_legacy_url_with_existing_query_uses_ampersand(self):
        url = await self.service.generate_external_link(
            bucket_id="b1",
            amount=75.0,
            deposit_id="d1",
            configured_url="https://pushpay.com/g/org?fund=tithe",
        )
        assert url == "https://pushpay.com/g/org?fund=tithe&a=75.0"

    @pytest.mark.asyncio
    async def test_no_configured_url_returns_fallback(self):
        url = await self.service.generate_external_link(
            bucket_id="bucket-123",
            amount=200.0,
            deposit_id="dep-456",
            configured_url=None,
        )
        assert "bucket-123" in url
        assert "200.0" in url
        assert "dep-456" in url

    @pytest.mark.asyncio
    async def test_zero_amount_in_template(self):
        url = await self.service.generate_external_link(
            bucket_id="b1",
            amount=0.0,
            deposit_id="d1",
            configured_url="https://example.com/pay?a={{amount}}",
        )
        assert url == "https://example.com/pay?a=0.0"


# ── PushpayIntegration.generate_giving_link ───────────────────────────────────

class TestPushpayIntegration:
    def setup_method(self):
        from app.services.transfer import PushpayIntegration
        self.pp = PushpayIntegration(api_key="test-key")

    @pytest.mark.asyncio
    async def test_basic_link(self):
        url = await self.pp.generate_giving_link("faith-church", 100.0)
        assert "faith-church" in url
        assert "a=100.0" in url

    @pytest.mark.asyncio
    async def test_link_with_fund(self):
        url = await self.pp.generate_giving_link("org", 50.0, fund_id="tithe")
        assert "f=tithe" in url
        assert "a=50.0" in url

    @pytest.mark.asyncio
    async def test_link_with_reference(self):
        url = await self.pp.generate_giving_link("org", 50.0, reference="dep-1")
        assert "r=dep-1" in url
