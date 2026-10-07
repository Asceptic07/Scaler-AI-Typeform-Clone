from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.question import Question, QuestionOption
    from app.models.response import Response


class Answer(Base):
    __tablename__ = "answers"
    __table_args__ = (
        UniqueConstraint(
            "response_id", "question_id", name="uq_answers_response_question"
        ),
        CheckConstraint(
            "(text_value IS NOT NULL) + (number_value IS NOT NULL) + "
            "(boolean_value IS NOT NULL) + (option_id IS NOT NULL) = 1",
            name="ck_answers_one_value",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    response_id: Mapped[int] = mapped_column(
        ForeignKey("responses.id", ondelete="CASCADE")
    )
    question_id: Mapped[int] = mapped_column(
        ForeignKey("questions.id", ondelete="CASCADE"), index=True
    )
    option_id: Mapped[int | None] = mapped_column(
        ForeignKey("question_options.id", ondelete="CASCADE"), index=True
    )
    text_value: Mapped[str | None] = mapped_column(Text)
    number_value: Mapped[float | None]
    boolean_value: Mapped[bool | None]
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.current_timestamp()
    )
    response: Mapped["Response"] = relationship(back_populates="answers")
    question: Mapped["Question"] = relationship()
    option: Mapped["QuestionOption | None"] = relationship()
