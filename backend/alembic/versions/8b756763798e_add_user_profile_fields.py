"""add_user_profile_fields

Revision ID: 8b756763798e
Revises: 7ed30a0d9efc
Create Date: 2025-10-18 00:14:53.894593

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8b756763798e'
down_revision: Union[str, Sequence[str], None] = '7ed30a0d9efc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add new columns to users table
    op.add_column('users', sa.Column('first_name', sa.String(), nullable=True))
    op.add_column('users', sa.Column('last_name', sa.String(), nullable=True))
    op.add_column('users', sa.Column('timezone', sa.String(), nullable=False, server_default='UTC'))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove columns from users table
    op.drop_column('users', 'timezone')
    op.drop_column('users', 'last_name')
    op.drop_column('users', 'first_name')
