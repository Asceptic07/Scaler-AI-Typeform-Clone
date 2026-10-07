from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, Enum, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.types import FormStatus

if TYPE_CHECKING:
    from app.models.question import Question
    from app.models.response import Response


class Form(Base):
    __tablename__ = "forms"
    __table_args__ = (
        CheckConstraint("length(trim(title)) > 0", name="ck_forms_title"),
        CheckConstraint(
            "status != 'published' OR public_slug IS NOT NULL",
            name="ck_forms_published_slug",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    status: Mapped[FormStatus] = mapped_column(
        Enum(FormStatus, native_enum=False, create_constraint=True, name="form_status"),
        default=FormStatus.draft,
        index=True,
    )
    public_slug: Mapped[str | None] = mapped_column(String(64), unique=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.current_timestamp()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )
    questions: Mapped[list["Question"]] = relationship(
        back_populates="form",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="Question.position",
    )
    responses: Mapped[list["Response"]] = relationship(
        back_populates="form", cascade="all, delete-orphan", passive_deletes=True
    )
