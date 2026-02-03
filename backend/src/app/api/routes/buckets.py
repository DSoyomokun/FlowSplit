from fastapi import APIRouter, HTTPException, status

from app.api.deps import CurrentUser
from app.core.database import SessionDep
from app.crud import (
    create_bucket,
    delete_bucket,
    get_bucket,
    get_buckets_by_user,
    reorder_buckets,
    update_bucket,
)
from app.schemas.bucket import BucketCreate, BucketReorder, BucketResponse, BucketUpdate

router = APIRouter(prefix="/buckets", tags=["buckets"])


@router.get("", response_model=list[BucketResponse])
async def list_buckets(
    session: SessionDep,
    current_user: CurrentUser,
    include_inactive: bool = False,
) -> list[BucketResponse]:
    buckets = await get_buckets_by_user(
        session, current_user.id, active_only=not include_inactive
    )
    return [BucketResponse.model_validate(b) for b in buckets]


@router.post("", response_model=BucketResponse, status_code=status.HTTP_201_CREATED)
async def create_new_bucket(
    session: SessionDep,
    current_user: CurrentUser,
    bucket_in: BucketCreate,
) -> BucketResponse:
    bucket = await create_bucket(session, current_user.id, bucket_in)
    return BucketResponse.model_validate(bucket)


@router.get("/{bucket_id}", response_model=BucketResponse)
async def get_bucket_by_id(
    session: SessionDep,
    current_user: CurrentUser,
    bucket_id: str,
) -> BucketResponse:
    bucket = await get_bucket(session, bucket_id)
    if not bucket or bucket.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Bucket not found"
        )
    return BucketResponse.model_validate(bucket)


@router.patch("/{bucket_id}", response_model=BucketResponse)
async def update_bucket_by_id(
    session: SessionDep,
    current_user: CurrentUser,
    bucket_id: str,
    bucket_in: BucketUpdate,
) -> BucketResponse:
    bucket = await get_bucket(session, bucket_id)
    if not bucket or bucket.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Bucket not found"
        )
    bucket = await update_bucket(session, bucket, bucket_in)
    return BucketResponse.model_validate(bucket)


@router.delete("/{bucket_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bucket_by_id(
    session: SessionDep,
    current_user: CurrentUser,
    bucket_id: str,
) -> None:
    bucket = await get_bucket(session, bucket_id)
    if not bucket or bucket.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Bucket not found"
        )
    await delete_bucket(session, bucket)


@router.post("/reorder", response_model=list[BucketResponse])
async def reorder_user_buckets(
    session: SessionDep,
    current_user: CurrentUser,
    reorder_in: BucketReorder,
) -> list[BucketResponse]:
    buckets = await reorder_buckets(session, current_user.id, reorder_in.bucket_ids)
    return [BucketResponse.model_validate(b) for b in buckets]
