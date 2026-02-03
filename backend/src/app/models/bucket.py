from datetime import datetime
from enum import Enum
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class BucketType(str, Enum):
    PERCENTAGE = "percentage"
    FIXED = "fixed"


class Bucket(Base):
    __tablename__ = "buckets"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid4()),
    )
    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )
    name: Mapped[str] = mapped_column(String(100))
    emoji: Mapped[str | None] = mapped_column(String(10), nullable=True)
    color: Mapped[str | None] = mapped_column(String(20), nullable=True)
    bucket_type: Mapped[str] = mapped_column(
        String(20), default=BucketType.PERCENTAGE.value
    )
    allocation_value: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    target_amount: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    current_balance: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    sort_order: Mapped[int] = mapped_column(default=0)
    is_active: Mapped[bool] = mapped_column(default=True)
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
    user: Mapped["User"] = relationship("User", back_populates="buckets")
    split_actions: Mapped[list["SplitAction"]] = relationship(
        "SplitAction", back_populates="bucket", cascade="all, delete-orphan"
    )
