from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine import reflection


revision = 'aa08abe2e642'
down_revision = 'e981d968166c'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name

    if dialect != 'sqlite':
        op.alter_column(
            'invoices',
            'status',
            existing_type=sa.VARCHAR(length=6),
            type_=sa.Enum('PAID', 'UNPAID', 'OVERDUE', name='invoicestatusenum'),
            existing_nullable=False
        )
    # Else: do nothing, since SQLite can't change column types


def downgrade() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name

    if dialect != 'sqlite':
        op.alter_column(
            'invoices',
            'status',
            existing_type=sa.Enum('PAID', 'UNPAID', 'OVERDUE', name='invoicestatusenum'),
            type_=sa.VARCHAR(length=6),
            existing_nullable=False
        )
