from datetime import datetime

from pydantic import BaseModel, Field

from app.models.split_plan import SplitPlanStatus


class SplitActionBase(BaseModel):
    bucket_id: str
    amount: float = Field(ge=0)


class SplitActionCreate(SplitActionBase):
    pass


class SplitActionUpdate(BaseModel):
    amount: float = Field(ge=0)


class SplitActionResponse(SplitActionBase):
    id: str
    split_plan_id: str
    executed: bool
    executed_at: datetime | None

    model_config = {"from_attributes": True}


class SplitPlanBase(BaseModel):
    deposit_id: str
    total_amount: float = Field(gt=0)


class SplitPlanCreate(SplitPlanBase):
    actions: list[SplitActionCreate]


class SplitPlanUpdate(BaseModel):
    actions: list[SplitActionUpdate] | None = None


class SplitPlanResponse(SplitPlanBase):
    id: str
    status: SplitPlanStatus
    approved_at: datetime | None
    executed_at: datetime | None
    created_at: datetime
    updated_at: datetime
    actions: list[SplitActionResponse]

    model_config = {"from_attributes": True}


class SplitPlanApprove(BaseModel):
    pass


class SplitPlanPreview(BaseModel):
    deposit_id: str
    total_amount: float
    actions: list[SplitActionBase]


class ActionExecutionResult(BaseModel):
    """Result of executing a single split action."""
    action_id: str
    bucket_id: str
    status: str  # pending, processing, completed, failed, manual_required
    amount: float
    error: str | None = None
    external_url: str | None = None
    transaction_id: str | None = None


class SplitExecutionResponse(BaseModel):
    """Response from split plan execution."""
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
            r.status in ("completed", "manual_required")
            for r in self.action_results
        )

    @property
    def has_failures(self) -> bool:
        return any(r.status == "failed" for r in self.action_results)
