from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class BankAccount(Base):
    __tablename__ = "bank_accounts"

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
    plaid_account_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    plaid_access_token: Mapped[str | None] = mapped_column(String(255), nullable=True)
    institution_name: Mapped[str] = mapped_column(String(255))
    account_name: Mapped[str] = mapped_column(String(255))
    account_mask: Mapped[str | None] = mapped_column(String(10), nullable=True)
    account_type: Mapped[str] = mapped_column(String(50), default="checking")
    is_primary: Mapped[bool] = mapped_column(default=False)
    balance: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
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
    user: Mapped["User"] = relationship("User", back_populates="bank_accounts")
