"""Add plaid_transfer_id to split_actions

Revision ID: 004
Revises: 003
Create Date: 2026-04-08
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = '004'
down_revision: Union[str, None] = '003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'split_actions',
        sa.Column('plaid_transfer_id', sa.String(255), nullable=True),
    )
    op.create_index(
        'ix_split_actions_plaid_transfer_id',
        'split_actions',
        ['plaid_transfer_id'],
    )


def downgrade() -> None:
    op.drop_index('ix_split_actions_plaid_transfer_id', table_name='split_actions')
    op.drop_column('split_actions', 'plaid_transfer_id')
