from datetime import datetime

from app.models.types import FormStatus
from app.schemas.common import ReadSchema, RequestSchema, Title
from app.schemas.question import QuestionRead


class FormCreate(RequestSchema):
    title: Title


class FormUpdate(FormCreate):
    pass


class FormSummary(ReadSchema):
    id: int
    title: str
    status: FormStatus
    public_slug: str | None
    response_count: int
    created_at: datetime
    updated_at: datetime


class FormDetail(FormSummary):
    questions: list[QuestionRead]


class PublicForm(ReadSchema):
    id: int
    public_slug: str
    title: str
    questions: list[QuestionRead]
