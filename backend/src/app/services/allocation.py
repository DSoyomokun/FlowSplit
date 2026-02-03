from app.models.bucket import Bucket, BucketType


def calculate_allocation(
    total_amount: float, buckets: list[Bucket]
) -> dict[str, float]:
    """
    Calculate how to split a deposit across buckets.

    Priority order:
    1. Fixed amount buckets (up to their allocation value)
    2. Percentage buckets (split remaining amount)

    Returns a dict of bucket_id -> amount
    """
    if not buckets:
        return {}

    allocations: dict[str, float] = {}
    remaining = total_amount

    # First, handle fixed amount buckets
    fixed_buckets = [b for b in buckets if b.bucket_type == BucketType.FIXED.value]
    for bucket in fixed_buckets:
        allocation = min(float(bucket.allocation_value), remaining)
        if allocation > 0:
            allocations[bucket.id] = round(allocation, 2)
            remaining -= allocation

    # Then, handle percentage buckets
    percentage_buckets = [
        b for b in buckets if b.bucket_type == BucketType.PERCENTAGE.value
    ]
    total_percentage = sum(float(b.allocation_value) for b in percentage_buckets)

    if total_percentage > 0 and remaining > 0:
        for bucket in percentage_buckets:
            percentage = float(bucket.allocation_value)
            if total_percentage > 100:
                # Normalize percentages if they exceed 100%
                percentage = (percentage / total_percentage) * 100
            allocation = round((percentage / 100) * remaining, 2)
            if allocation > 0:
                allocations[bucket.id] = allocation

    # Adjust for rounding errors
    allocated_total = sum(allocations.values())
    if allocations and abs(total_amount - allocated_total) > 0.01:
        # Add the difference to the first bucket
        first_bucket_id = next(iter(allocations))
        allocations[first_bucket_id] = round(
            allocations[first_bucket_id] + (total_amount - allocated_total), 2
        )

    return allocations
