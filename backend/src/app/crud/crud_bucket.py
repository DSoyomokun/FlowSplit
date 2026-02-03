from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.bucket import Bucket
from app.schemas.bucket import BucketCreate, BucketUpdate


async def get_bucket(session: AsyncSession, bucket_id: str) -> Bucket | None:
    result = await session.execute(select(Bucket).where(Bucket.id == bucket_id))
    return result.scalar_one_or_none()


async def get_buckets_by_user(
    session: AsyncSession, user_id: str, active_only: bool = True
) -> list[Bucket]:
    query = select(Bucket).where(Bucket.user_id == user_id)
    if active_only:
        query = query.where(Bucket.is_active == True)  # noqa: E712
    query = query.order_by(Bucket.sort_order)
    result = await session.execute(query)
    return list(result.scalars().all())


async def create_bucket(
    session: AsyncSession, user_id: str, bucket_in: BucketCreate
) -> Bucket:
    # Get max sort order for user
    result = await session.execute(
        select(Bucket.sort_order)
        .where(Bucket.user_id == user_id)
        .order_by(Bucket.sort_order.desc())
        .limit(1)
    )
    max_order = result.scalar_one_or_none() or 0

    bucket = Bucket(
        user_id=user_id,
        sort_order=max_order + 1,
        **bucket_in.model_dump(),
    )
    session.add(bucket)
    await session.flush()
    await session.refresh(bucket)
    return bucket


async def update_bucket(
    session: AsyncSession, bucket: Bucket, bucket_in: BucketUpdate
) -> Bucket:
    update_data = bucket_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(bucket, field, value)

    await session.flush()
    await session.refresh(bucket)
    return bucket


async def delete_bucket(session: AsyncSession, bucket: Bucket) -> None:
    bucket.is_active = False
    await session.flush()


async def reorder_buckets(
    session: AsyncSession, user_id: str, bucket_ids: list[str]
) -> list[Bucket]:
    for index, bucket_id in enumerate(bucket_ids):
        await session.execute(
            update(Bucket)
            .where(Bucket.id == bucket_id, Bucket.user_id == user_id)
            .values(sort_order=index)
        )
    return await get_buckets_by_user(session, user_id)


async def update_bucket_balance(
    session: AsyncSession, bucket_id: str, amount: float
) -> Bucket | None:
    bucket = await get_bucket(session, bucket_id)
    if bucket:
        bucket.current_balance = float(bucket.current_balance) + amount
        await session.flush()
        await session.refresh(bucket)
    return bucket
