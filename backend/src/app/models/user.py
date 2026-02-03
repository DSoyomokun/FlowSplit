from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid4()),
    )
    # Supabase Auth user ID - this links to Supabase auth.users
    supabase_id: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    phone_number: Mapped[str | None] = mapped_column(
        String(20), unique=True, index=True, nullable=True
    )
    email: Mapped[str | None] = mapped_column(
        String(255), unique=True, index=True, nullable=True
    )
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
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
    bank_accounts: Mapped[list["BankAccount"]] = relationship(
        "BankAccount", back_populates="user", cascade="all, delete-orphan"
    )
    buckets: Mapped[list["Bucket"]] = relationship(
        "Bucket", back_populates="user", cascade="all, delete-orphan"
    )
    deposits: Mapped[list["Deposit"]] = relationship(
        "Deposit", back_populates="user", cascade="all, delete-orphan"
    )
