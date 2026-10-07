"""Add forward conditional logic rules.

Revision ID: b7c91d2e4a60
Revises: e42a53e64a4a
"""

import sqlalchemy as sa

from alembic import op

revision = "b7c91d2e4a60"
down_revision = "e42a53e64a4a"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "logic_rules",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("source_question_id", sa.Integer(), nullable=False),
        sa.Column("condition_option_id", sa.Integer(), nullable=True),
        sa.Column(
            "condition_boolean_value",
            sa.Boolean(create_constraint=True, name="ck_logic_boolean"),
            nullable=True,
        ),
        sa.Column("condition_rating_value", sa.Integer(), nullable=True),
        sa.Column("target_question_id", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.current_timestamp(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["source_question_id"], ["questions.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["condition_option_id"], ["question_options.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["target_question_id"], ["questions.id"], ondelete="CASCADE"
        ),
        sa.CheckConstraint(
            "(condition_option_id IS NOT NULL) + (condition_boolean_value IS NOT NULL) + (condition_rating_value IS NOT NULL) = 1",
            name="ck_logic_one_condition",
        ),
        sa.CheckConstraint(
            "condition_rating_value BETWEEN 1 AND 5", name="ck_logic_rating"
        ),
        sa.UniqueConstraint(
            "source_question_id", "condition_option_id", name="uq_logic_option"
        ),
        sa.UniqueConstraint(
            "source_question_id", "condition_boolean_value", name="uq_logic_boolean"
        ),
        sa.UniqueConstraint(
            "source_question_id", "condition_rating_value", name="uq_logic_rating"
        ),
    )
    for column in ("source_question_id", "condition_option_id", "target_question_id"):
        op.create_index(f"ix_logic_rules_{column}", "logic_rules", [column])


def downgrade() -> None:
    op.drop_table("logic_rules")
