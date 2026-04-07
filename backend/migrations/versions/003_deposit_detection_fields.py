"""Add deposit detection fields

Adds plaid_transaction_id to deposits (dedup) and source to split_plans (auto vs manual).
bank_accounts.cursor already exists from initial schema.

Revision ID: 003
Revises: 002
Create Date: 2026-04-07
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = '003'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # deposits: plaid_transaction_id for deduplication
    op.add_column(
        'deposits',
        sa.Column('plaid_transaction_id', sa.String(255), nullable=True),
    )
    op.create_unique_constraint(
        'uq_deposits_plaid_transaction_id',
        'deposits',
        ['plaid_transaction_id'],
    )

    # split_plans: source distinguishes auto-applied vs manually created plans
    op.add_column(
        'split_plans',
        sa.Column('source', sa.String(20), nullable=False, server_default='manual'),
    )


def downgrade() -> None:
    op.drop_column('split_plans', 'source')
    op.drop_constraint('uq_deposits_plaid_transaction_id', 'deposits', type_='unique')
    op.drop_column('deposits', 'plaid_transaction_id')
