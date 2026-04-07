from datetime import datetime

from pydantic import BaseModel, Field

from app.models.bucket import BucketType


# ─── Item schemas ─────────────────────────────────────────────────────────────

class SplitTemplateItemBase(BaseModel):
    bucket_id: str
    allocation_type: BucketType = BucketType.PERCENTAGE
    allocation_value: float = Field(ge=0)


class SplitTemplateItemCreate(SplitTemplateItemBase):
    pass


class BucketSummary(BaseModel):
    """Minimal bucket info embedded in template item responses."""
    id: str
    name: str
    color: str | None
    emoji: str | None

    model_config = {"from_attributes": True}


class SplitTemplateItemResponse(SplitTemplateItemBase):
    id: str
    sort_order: int
    bucket: BucketSummary | None

    model_config = {"from_attributes": True}


# ─── Template schemas ─────────────────────────────────────────────────────────

class SplitTemplateCreate(BaseModel):
    name: str = Field(..., max_length=100)
    items: list[SplitTemplateItemCreate] = Field(..., min_length=1)


class SplitTemplateUpdate(BaseModel):
    name: str | None = Field(None, max_length=100)
    items: list[SplitTemplateItemCreate] | None = None  # replaces all items when provided


class SplitTemplateResponse(BaseModel):
    id: str
    user_id: str
    name: str
    items: list[SplitTemplateItemResponse]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
