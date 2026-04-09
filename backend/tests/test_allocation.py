"""
Tests for the allocation service (Story 097).

calculate_allocation is a pure function — no DB or mocks needed.

Design note: The function always allocates 100% of total_amount.
Buckets not summing to 100% will have the remainder added to the first bucket
(rounding-adjustment behavior). The caller is responsible for providing a
complete allocation plan.
"""

import pytest

from app.models.bucket import BucketType
from app.services.allocation import calculate_allocation
from tests.conftest import make_bucket


# ── Basic cases ───────────────────────────────────────────────────────────────

def test_empty_buckets_returns_empty():
    assert calculate_allocation(1000.0, []) == {}


def test_single_100_percent_bucket():
    """One bucket at 100% gets the full amount."""
    buckets = [make_bucket("savings", BucketType.PERCENTAGE, 100)]
    result = calculate_allocation(1000.0, buckets)
    assert result["savings"] == 1000.0


def test_two_equal_percentage_buckets():
    """50/50 split."""
    buckets = [
        make_bucket("a", BucketType.PERCENTAGE, 50),
        make_bucket("b", BucketType.PERCENTAGE, 50),
    ]
    result = calculate_allocation(1000.0, buckets)
    assert result["a"] == 500.0
    assert result["b"] == 500.0


def test_multiple_percentage_buckets_summing_to_100():
    buckets = [
        make_bucket("tithe", BucketType.PERCENTAGE, 10),
        make_bucket("savings", BucketType.PERCENTAGE, 15),
        make_bucket("investing", BucketType.PERCENTAGE, 75),
    ]
    result = calculate_allocation(1000.0, buckets)
    assert result["tithe"] == pytest.approx(100.0, abs=0.02)
    assert result["savings"] == pytest.approx(150.0, abs=0.02)
    assert result["investing"] == pytest.approx(750.0, abs=0.02)


def test_fixed_bucket_exact_amount():
    """Fixed bucket capped to its configured value when funds allow."""
    buckets = [
        make_bucket("tithe", BucketType.FIXED, 200),
        make_bucket("rest", BucketType.PERCENTAGE, 100),  # takes remaining
    ]
    result = calculate_allocation(1000.0, buckets)
    assert result["tithe"] == 200.0
    assert result["rest"] == 800.0


def test_fixed_bucket_capped_at_remaining_amount():
    """Fixed bucket can't exceed available funds."""
    buckets = [
        make_bucket("fixed", BucketType.FIXED, 2000),
        make_bucket("rest", BucketType.PERCENTAGE, 100),
    ]
    result = calculate_allocation(500.0, buckets)
    assert result["fixed"] == 500.0
    # rest gets 100% of 0 remaining
    assert result.get("rest", 0.0) == 0.0


def test_fixed_takes_priority_before_percentage():
    """Fixed buckets are processed before percentage buckets."""
    buckets = [
        make_bucket("fixed", BucketType.FIXED, 300),
        make_bucket("pct", BucketType.PERCENTAGE, 100),  # 100% of remaining
    ]
    result = calculate_allocation(1000.0, buckets)
    assert result["fixed"] == 300.0
    assert result["pct"] == pytest.approx(700.0, abs=0.02)


def test_percentage_over_100_normalizes():
    """When percentages sum >100%, they are normalized proportionally."""
    buckets = [
        make_bucket("a", BucketType.PERCENTAGE, 60),
        make_bucket("b", BucketType.PERCENTAGE, 60),
    ]
    result = calculate_allocation(1000.0, buckets)
    # 60/(60+60) = 50% each of 1000
    assert result["a"] == pytest.approx(500.0, abs=0.02)
    assert result["b"] == pytest.approx(500.0, abs=0.02)


def test_allocations_sum_to_total():
    """All allocations together should equal the total deposit."""
    buckets = [
        make_bucket("tithe", BucketType.FIXED, 120),
        make_bucket("savings", BucketType.PERCENTAGE, 20),
        make_bucket("rest", BucketType.PERCENTAGE, 80),
    ]
    result = calculate_allocation(1200.0, buckets)
    assert sum(result.values()) == pytest.approx(1200.0, abs=0.02)


def test_all_values_rounded_to_cents():
    buckets = [
        make_bucket("a", BucketType.PERCENTAGE, 33),
        make_bucket("b", BucketType.PERCENTAGE, 67),
    ]
    result = calculate_allocation(100.0, buckets)
    for val in result.values():
        assert val == round(val, 2)


# ── Edge cases ────────────────────────────────────────────────────────────────

def test_single_cent():
    buckets = [make_bucket("s", BucketType.PERCENTAGE, 100)]
    result = calculate_allocation(0.01, buckets)
    assert result["s"] == 0.01


def test_large_amount():
    buckets = [
        make_bucket("a", BucketType.PERCENTAGE, 50),
        make_bucket("b", BucketType.PERCENTAGE, 50),
    ]
    result = calculate_allocation(100_000.0, buckets)
    assert result["a"] == 50_000.0
    assert result["b"] == 50_000.0


def test_mixed_fixed_and_percentage_sums_to_total():
    buckets = [
        make_bucket("tithe", BucketType.FIXED, 120),
        make_bucket("savings", BucketType.PERCENTAGE, 30),
        make_bucket("rest", BucketType.PERCENTAGE, 70),
    ]
    result = calculate_allocation(1200.0, buckets)
    assert result["tithe"] == 120.0
    remaining = 1200.0 - 120.0  # $1080
    assert result["savings"] == pytest.approx(remaining * 0.30, abs=0.02)
    assert result["rest"] == pytest.approx(remaining * 0.70, abs=0.02)
    assert sum(result.values()) == pytest.approx(1200.0, abs=0.02)


def test_rounding_adjustment_applied_on_large_error():
    """Rounding adjustment kicks in when accumulated error exceeds $0.01.

    3 buckets at 33% each sum to 99% — the $1 remainder is added to the first
    bucket so the total comes out exactly right.
    """
    buckets = [
        make_bucket("a", BucketType.PERCENTAGE, 33),
        make_bucket("b", BucketType.PERCENTAGE, 33),
        make_bucket("c", BucketType.PERCENTAGE, 33),
    ]
    result = calculate_allocation(100.0, buckets)
    assert sum(result.values()) == pytest.approx(100.0, abs=0.001)
    # First bucket absorbs the $1 remainder (33 + 1 = 34)
    assert result["a"] == 34.0
