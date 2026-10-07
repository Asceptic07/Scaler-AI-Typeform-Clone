from typing import Self

from pydantic import Field, StrictBool, StrictInt, model_validator

from app.schemas.common import ReadSchema, RequestSchema


class LogicRuleInput(RequestSchema):
    condition_option_id: StrictInt | None = None
    condition_boolean_value: StrictBool | None = None
    condition_rating_value: StrictInt | None = Field(default=None, ge=1, le=5)
    target_question_id: StrictInt | None

    @model_validator(mode="after")
    def exactly_one_condition(self) -> Self:
        if (
            sum(
                value is not None
                for value in (
                    self.condition_option_id,
                    self.condition_boolean_value,
                    self.condition_rating_value,
                )
            )
            != 1
        ):
            raise ValueError("Provide exactly one condition value")
        return self


class LogicRuleRead(LogicRuleInput, ReadSchema):
    id: int


class LogicReplace(RequestSchema):
    rules: list[LogicRuleInput] = Field(max_length=100)
