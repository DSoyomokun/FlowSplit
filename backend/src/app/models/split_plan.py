from datetime import datetime
from enum import Enum
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class SplitPlanStatus(str, Enum):
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    EXECUTING = "executing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class SplitPlan(Base):
    __tablename__ = "split_plans"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid4()),
    )
    deposit_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("deposits.id", ondelete="CASCADE"),
        unique=True,
    )
    total_amount: Mapped[float] = mapped_column(Numeric(12, 2))
    status: Mapped[str] = mapped_column(
        String(20), default=SplitPlanStatus.DRAFT.value
    )
    approved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    executed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Relationships
    deposit: Mapped["Deposit"] = relationship("Deposit", back_populates="split_plan")
    actions: Mapped[list["SplitAction"]] = relationship(
        "SplitAction", back_populates="split_plan", cascade="all, delete-orphan"
    )


class SplitAction(Base):
    __tablename__ = "split_actions"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid4()),
    )
    split_plan_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("split_plans.id", ondelete="CASCADE"),
        index=True,
    )
    bucket_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("buckets.id", ondelete="CASCADE"),
    )
    amount: Mapped[float] = mapped_column(Numeric(12, 2))
    executed: Mapped[bool] = mapped_column(default=False)
    executed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    split_plan: Mapped["SplitPlan"] = relationship(
        "SplitPlan", back_populates="actions"
    )
    bucket: Mapped["Bucket"] = relationship("Bucket", back_populates="split_actions")
