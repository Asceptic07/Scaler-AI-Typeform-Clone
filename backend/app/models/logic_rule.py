from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class LogicRule(Base):
    __tablename__ = "logic_rules"
    __table_args__ = (
        CheckConstraint(
            "(condition_option_id IS NOT NULL) + (condition_boolean_value IS NOT NULL) "
            "+ (condition_rating_value IS NOT NULL) = 1",
            name="ck_logic_one_condition",
        ),
        CheckConstraint(
            "condition_rating_value BETWEEN 1 AND 5", name="ck_logic_rating"
        ),
        UniqueConstraint(
            "source_question_id", "condition_option_id", name="uq_logic_option"
        ),
        UniqueConstraint(
            "source_question_id", "condition_boolean_value", name="uq_logic_boolean"
        ),
        UniqueConstraint(
            "source_question_id", "condition_rating_value", name="uq_logic_rating"
        ),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    source_question_id: Mapped[int] = mapped_column(
        ForeignKey("questions.id", ondelete="CASCADE"), index=True
    )
    condition_option_id: Mapped[int | None] = mapped_column(
        ForeignKey("question_options.id", ondelete="CASCADE"), index=True
    )
    condition_boolean_value: Mapped[bool | None] = mapped_column(
        Boolean(create_constraint=True, name="ck_logic_boolean")
    )
    condition_rating_value: Mapped[int | None]
    target_question_id: Mapped[int | None] = mapped_column(
        ForeignKey("questions.id", ondelete="CASCADE"), index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.current_timestamp()
    )
