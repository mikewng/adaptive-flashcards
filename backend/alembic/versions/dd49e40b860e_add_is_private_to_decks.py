"""add_is_private_to_decks

Revision ID: dd49e40b860e
Revises: 377e1dad6030
Create Date: 2025-10-16 10:59:28.305526

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dd49e40b860e'
down_revision: Union[str, Sequence[str], None] = '377e1dad6030'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add is_private column to decks table, defaulting to True (private)
    op.add_column('decks', sa.Column('is_private', sa.Boolean(), nullable=False, server_default='1'))

    # Create index on is_private for efficient public deck queries
    op.create_index(op.f('ix_decks_is_private'), 'decks', ['is_private'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    # Drop the index and column
    op.drop_index(op.f('ix_decks_is_private'), table_name='decks')
    op.drop_column('decks', 'is_private')
