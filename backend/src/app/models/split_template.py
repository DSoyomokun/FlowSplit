from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class SplitTemplate(Base):
    __tablename__ = "split_templates"

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
    user: Mapped["User"] = relationship("User", back_populates="split_templates")
    items: Mapped[list["SplitTemplateItem"]] = relationship(
        "SplitTemplateItem",
        back_populates="template",
        cascade="all, delete-orphan",
        order_by="SplitTemplateItem.sort_order",
    )


class SplitTemplateItem(Base):
    __tablename__ = "split_template_items"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid4()),
    )
    template_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("split_templates.id", ondelete="CASCADE"),
        index=True,
    )
    bucket_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("buckets.id", ondelete="CASCADE"),
    )
    allocation_type: Mapped[str] = mapped_column(String(20))  # percentage | fixed
    allocation_value: Mapped[float] = mapped_column(Numeric(12, 2))
    sort_order: Mapped[int] = mapped_column(default=0)

    # Relationships
    template: Mapped["SplitTemplate"] = relationship(
        "SplitTemplate", back_populates="items"
    )
    bucket: Mapped["Bucket"] = relationship("Bucket")
