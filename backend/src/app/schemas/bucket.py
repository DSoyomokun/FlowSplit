from datetime import datetime

from pydantic import BaseModel, Field

from app.models.bucket import BucketType, DeliveryMethod


class BucketBase(BaseModel):
    name: str = Field(..., max_length=100)
    emoji: str | None = None
    color: str | None = None
    bucket_type: BucketType = BucketType.PERCENTAGE
    allocation_value: float = Field(ge=0)
    target_amount: float | None = None
    destination_type: DeliveryMethod | None = DeliveryMethod.INTERNAL_TRANSFER
    external_url: str | None = None
    external_name: str | None = None


class BucketCreate(BucketBase):
    pass


class BucketUpdate(BaseModel):
    name: str | None = Field(None, max_length=100)
    emoji: str | None = None
    color: str | None = None
    bucket_type: BucketType | None = None
    allocation_value: float | None = Field(None, ge=0)
    target_amount: float | None = None
    sort_order: int | None = None
    is_active: bool | None = None
    destination_type: DeliveryMethod | None = None
    external_url: str | None = None
    external_name: str | None = None


class BucketResponse(BucketBase):
    id: str
    user_id: str
    current_balance: float
    sort_order: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BucketReorder(BaseModel):
    bucket_ids: list[str]
