"""Initial schema for FlowSplit

Revision ID: 001
Revises:
Create Date: 2024-05-24

"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column('supabase_id', sa.String(255), unique=True, nullable=False),
        sa.Column('phone_number', sa.String(20), unique=True, nullable=True),
        sa.Column('email', sa.String(255), unique=True, nullable=True),
        sa.Column('full_name', sa.String(255), nullable=True),
        sa.Column('push_token', sa.String(255), nullable=True),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('ix_users_supabase_id', 'users', ['supabase_id'])

    # Bank accounts table
    op.create_table(
        'bank_accounts',
        sa.Column('id', postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=False), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('plaid_item_id', sa.String(255), nullable=True),
        sa.Column('plaid_account_id', sa.String(255), nullable=True),
        sa.Column('plaid_access_token', sa.Text(), nullable=True),
        sa.Column('institution_id', sa.String(100), nullable=True),
        sa.Column('institution_name', sa.String(255), nullable=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('official_name', sa.String(255), nullable=True),
        sa.Column('type', sa.String(50), nullable=False),  # depository, credit, etc.
        sa.Column('subtype', sa.String(50), nullable=True),  # checking, savings, etc.
        sa.Column('mask', sa.String(10), nullable=True),  # Last 4 digits
        sa.Column('cursor', sa.Text(), nullable=True),  # Plaid sync cursor
        sa.Column('is_primary', sa.Boolean(), default=False),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('ix_bank_accounts_user_id', 'bank_accounts', ['user_id'])
    op.create_index('ix_bank_accounts_plaid_item_id', 'bank_accounts', ['plaid_item_id'])

    # Buckets table
    op.create_table(
        'buckets',
        sa.Column('id', postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=False), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('emoji', sa.String(10), nullable=True),
        sa.Column('color', sa.String(20), nullable=True),
        sa.Column('bucket_type', sa.String(20), nullable=False),  # percentage, fixed
        sa.Column('allocation_value', sa.Numeric(12, 2), nullable=False),
        sa.Column('target_amount', sa.Numeric(12, 2), nullable=True),
        sa.Column('current_balance', sa.Numeric(12, 2), default=0),
        sa.Column('destination_type', sa.String(20), nullable=True),  # bank, external
        sa.Column('destination_account_id', postgresql.UUID(as_uuid=False), sa.ForeignKey('bank_accounts.id', ondelete='SET NULL'), nullable=True),
        sa.Column('external_url', sa.Text(), nullable=True),
        sa.Column('external_name', sa.String(255), nullable=True),
        sa.Column('sort_order', sa.Integer(), default=0),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('ix_buckets_user_id', 'buckets', ['user_id'])

    # Deposits table
    op.create_table(
        'deposits',
        sa.Column('id', postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=False), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('bank_account_id', postgresql.UUID(as_uuid=False), sa.ForeignKey('bank_accounts.id', ondelete='SET NULL'), nullable=True),
        sa.Column('plaid_transaction_id', sa.String(255), unique=True, nullable=True),
        sa.Column('amount', sa.Numeric(12, 2), nullable=False),
        sa.Column('source', sa.String(255), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', sa.String(20), default='pending'),  # pending, processing, completed, failed
        sa.Column('detected_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_deposits_user_id', 'deposits', ['user_id'])
    op.create_index('ix_deposits_status', 'deposits', ['status'])
    op.create_index('ix_deposits_plaid_transaction_id', 'deposits', ['plaid_transaction_id'])

    # Split plans table
    op.create_table(
        'split_plans',
        sa.Column('id', postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column('deposit_id', postgresql.UUID(as_uuid=False), sa.ForeignKey('deposits.id', ondelete='CASCADE'), unique=True, nullable=False),
        sa.Column('total_amount', sa.Numeric(12, 2), nullable=False),
        sa.Column('status', sa.String(20), default='draft'),  # draft, pending_approval, approved, executing, completed, cancelled
        sa.Column('approved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('executed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('ix_split_plans_deposit_id', 'split_plans', ['deposit_id'])

    # Split actions table
    op.create_table(
        'split_actions',
        sa.Column('id', postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column('split_plan_id', postgresql.UUID(as_uuid=False), sa.ForeignKey('split_plans.id', ondelete='CASCADE'), nullable=False),
        sa.Column('bucket_id', postgresql.UUID(as_uuid=False), sa.ForeignKey('buckets.id', ondelete='CASCADE'), nullable=False),
        sa.Column('amount', sa.Numeric(12, 2), nullable=False),
        sa.Column('executed', sa.Boolean(), default=False),
        sa.Column('executed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('transaction_id', sa.String(255), nullable=True),
        sa.Column('error', sa.Text(), nullable=True),
        sa.Column('external_url', sa.Text(), nullable=True),
    )
    op.create_index('ix_split_actions_split_plan_id', 'split_actions', ['split_plan_id'])


def downgrade() -> None:
    op.drop_table('split_actions')
    op.drop_table('split_plans')
    op.drop_table('deposits')
    op.drop_table('buckets')
    op.drop_table('bank_accounts')
    op.drop_table('users')
