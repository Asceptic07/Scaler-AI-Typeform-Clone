from app.models.types import QuestionType
from app.schemas.common import ReadSchema


class DistributionItem(ReadSchema):
    value: int | bool
    label: str
    count: int


class QuestionStatistics(ReadSchema):
    question_id: int
    title: str
    type: QuestionType
    answered_count: int
    distribution: list[DistributionItem]


class FormStatistics(ReadSchema):
    form_id: int
    total_response_count: int
    questions: list[QuestionStatistics]
