"""Add split_templates and split_template_items tables

Revision ID: 002
Revises: 001
Create Date: 2026-04-07

"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'split_templates',
        sa.Column('id', postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=False),
                  sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(),
                  onupdate=sa.func.now()),
    )
    op.create_index('ix_split_templates_user_id', 'split_templates', ['user_id'])

    op.create_table(
        'split_template_items',
        sa.Column('id', postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column('template_id', postgresql.UUID(as_uuid=False),
                  sa.ForeignKey('split_templates.id', ondelete='CASCADE'), nullable=False),
        sa.Column('bucket_id', postgresql.UUID(as_uuid=False),
                  sa.ForeignKey('buckets.id', ondelete='CASCADE'), nullable=False),
        sa.Column('allocation_type', sa.String(20), nullable=False),
        sa.Column('allocation_value', sa.Numeric(12, 2), nullable=False),
        sa.Column('sort_order', sa.Integer(), default=0, nullable=False),
    )
    op.create_index('ix_split_template_items_template_id', 'split_template_items', ['template_id'])


def downgrade() -> None:
    op.drop_table('split_template_items')
    op.drop_table('split_templates')
