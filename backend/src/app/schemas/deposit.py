from datetime import datetime

from pydantic import BaseModel, Field

from app.models.deposit import DepositStatus


class DepositBase(BaseModel):
    amount: float = Field(gt=0)
    source: str | None = None
    description: str | None = None


class DepositCreate(DepositBase):
    bank_account_id: str | None = None


class DepositResponse(DepositBase):
    id: str
    user_id: str
    bank_account_id: str | None
    status: DepositStatus
    detected_at: datetime
    processed_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}
