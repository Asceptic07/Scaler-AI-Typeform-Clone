"""create relational forms questions responses and answers

Revision ID: e42a53e64a4a
Revises:
Create Date: 2026-10-06 22:22:50.212136

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e42a53e64a4a"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "forms",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column(
            "status",
            sa.Enum(
                "draft",
                "published",
                name="form_status",
                native_enum=False,
                create_constraint=True,
            ),
            nullable=False,
        ),
        sa.Column("public_slug", sa.String(length=64), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "status != 'published' OR public_slug IS NOT NULL",
            name="ck_forms_published_slug",
        ),
        sa.CheckConstraint("length(trim(title)) > 0", name="ck_forms_title"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("public_slug"),
    )
    with op.batch_alter_table("forms", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_forms_status"), ["status"], unique=False)

    op.create_table(
        "questions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("form_id", sa.Integer(), nullable=False),
        sa.Column(
            "type",
            sa.Enum(
                "short_text",
                "long_text",
                "multiple_choice",
                "dropdown",
                "email",
                "number",
                "yes_no",
                "rating",
                name="question_type",
                native_enum=False,
                create_constraint=True,
            ),
            nullable=False,
        ),
        sa.Column("title", sa.String(length=500), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("required", sa.Boolean(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("length(trim(title)) > 0", name="ck_questions_title"),
        sa.CheckConstraint("position >= 0", name="ck_questions_position"),
        sa.ForeignKeyConstraint(["form_id"], ["forms.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("form_id", "position", name="uq_questions_form_position"),
    )
    with op.batch_alter_table("questions", schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f("ix_questions_form_id"), ["form_id"], unique=False
        )

    op.create_table(
        "responses",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("form_id", sa.Integer(), nullable=False),
        sa.Column(
            "submitted_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["form_id"], ["forms.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("responses", schema=None) as batch_op:
        batch_op.create_index(
            "ix_responses_form_submitted",
            ["form_id", "submitted_at", "id"],
            unique=False,
        )

    op.create_table(
        "question_options",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("question_id", sa.Integer(), nullable=False),
        sa.Column("label", sa.String(length=500), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.CheckConstraint("length(trim(label)) > 0", name="ck_options_label"),
        sa.CheckConstraint("position >= 0", name="ck_options_position"),
        sa.ForeignKeyConstraint(["question_id"], ["questions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "question_id", "position", name="uq_options_question_position"
        ),
    )
    with op.batch_alter_table("question_options", schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f("ix_question_options_question_id"), ["question_id"], unique=False
        )

    op.create_table(
        "answers",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("response_id", sa.Integer(), nullable=False),
        sa.Column("question_id", sa.Integer(), nullable=False),
        sa.Column("option_id", sa.Integer(), nullable=True),
        sa.Column("text_value", sa.Text(), nullable=True),
        sa.Column("number_value", sa.Double(), nullable=True),
        sa.Column("boolean_value", sa.Boolean(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "(text_value IS NOT NULL) + (number_value IS NOT NULL) + (boolean_value IS NOT NULL) + (option_id IS NOT NULL) = 1",
            name="ck_answers_one_value",
        ),
        sa.ForeignKeyConstraint(
            ["option_id"], ["question_options.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["question_id"], ["questions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["response_id"], ["responses.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "response_id", "question_id", name="uq_answers_response_question"
        ),
    )
    with op.batch_alter_table("answers", schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f("ix_answers_option_id"), ["option_id"], unique=False
        )
        batch_op.create_index(
            batch_op.f("ix_answers_question_id"), ["question_id"], unique=False
        )


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table("answers", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_answers_question_id"))
        batch_op.drop_index(batch_op.f("ix_answers_option_id"))

    op.drop_table("answers")
    with op.batch_alter_table("question_options", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_question_options_question_id"))

    op.drop_table("question_options")
    with op.batch_alter_table("responses", schema=None) as batch_op:
        batch_op.drop_index("ix_responses_form_submitted")

    op.drop_table("responses")
    with op.batch_alter_table("questions", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_questions_form_id"))

    op.drop_table("questions")
    with op.batch_alter_table("forms", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_forms_status"))

    op.drop_table("forms")
