from typing import Self

from pydantic import Field, StrictInt, computed_field, model_validator

from app.models.types import CHOICE_TYPES, QuestionType
from app.schemas.common import OptionLabel, QuestionTitle, ReadSchema, RequestSchema


class OptionCreate(RequestSchema):
    label: OptionLabel


class OptionRead(ReadSchema):
    id: int
    label: str
    position: int


class QuestionCreate(RequestSchema):
    type: QuestionType
    title: QuestionTitle
    description: str | None = Field(default=None, max_length=5000)
    required: bool = False
    options: list[OptionCreate] = Field(default_factory=list, max_length=100)

    @model_validator(mode="after")
    def validate_options(self) -> Self:
        if self.type in CHOICE_TYPES and not self.options:
            raise ValueError("Choice questions need at least one option")
        if self.type not in CHOICE_TYPES and self.options:
            raise ValueError("This question type does not accept options")
        labels = [option.label for option in self.options]
        if len(set(labels)) != len(labels):
            raise ValueError("Option labels must be unique within a question")
        return self


class QuestionUpdate(RequestSchema):
    type: QuestionType | None = None
    title: QuestionTitle | None = None
    description: str | None = Field(default=None, max_length=5000)
    required: bool | None = None
    options: list[OptionCreate] | None = Field(default=None, max_length=100)

    @model_validator(mode="after")
    def reject_null_configuration(self) -> Self:
        for field in self.model_fields_set - {"description"}:
            if getattr(self, field) is None:
                raise ValueError(f"{field} cannot be null")
        return self


class QuestionRead(ReadSchema):
    id: int
    type: QuestionType
    title: str
    description: str | None
    required: bool
    position: int
    options: list[OptionRead]

    @computed_field
    @property
    def rating_min(self) -> int | None:
        return 1 if self.type == QuestionType.rating else None

    @computed_field
    @property
    def rating_max(self) -> int | None:
        return 5 if self.type == QuestionType.rating else None


class QuestionReorder(RequestSchema):
    question_ids: list[StrictInt]
