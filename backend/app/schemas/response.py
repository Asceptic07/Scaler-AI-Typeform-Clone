from datetime import datetime

from pydantic import Field, StrictBool, StrictFloat, StrictInt, StrictStr

from app.models.types import QuestionType
from app.schemas.common import ReadSchema, RequestSchema


class AnswerSubmit(RequestSchema):
    question_id: StrictInt
    value: StrictStr | StrictInt | StrictFloat | StrictBool | None


class ResponseSubmit(RequestSchema):
    answers: list[AnswerSubmit] = Field(max_length=1000)


class ResponseReceipt(ReadSchema):
    id: int
    submitted_at: datetime


class AnswerRead(ReadSchema):
    question_id: int
    question_title: str
    question_type: QuestionType
    value: str | int | float | bool
    option_id: int | None = None
    option_label: str | None = None


class ResponseDetail(ResponseReceipt):
    answers: list[AnswerRead]
