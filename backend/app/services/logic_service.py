from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.models import Form, LogicRule, Question
from app.models.types import CHOICE_TYPES, QuestionType
from app.schemas.logic import LogicRuleInput

LOGIC_TYPES = {*CHOICE_TYPES, QuestionType.yes_no, QuestionType.rating}


def validate_rules(
    form: Form,
    source: Question,
    rules: list[LogicRuleInput],
    positions: dict[int, int] | None = None,
) -> None:
    if rules and source.type not in LOGIC_TYPES:
        raise HTTPException(
            422, "Logic is supported only for choice, yes/no and rating questions"
        )
    positions = (
        positions
        if positions is not None
        else {q.id: q.position for q in form.questions}
    )
    conditions = set()
    for rule in rules:
        if source.type in CHOICE_TYPES:
            if rule.condition_option_id not in {o.id for o in source.options}:
                raise HTTPException(
                    422, "The condition must use an option belonging to this question"
                )
            condition = rule.condition_option_id
        elif source.type == QuestionType.yes_no:
            if rule.condition_boolean_value is None:
                raise HTTPException(422, "Yes/No logic requires a boolean condition")
            condition = rule.condition_boolean_value
        else:
            if rule.condition_rating_value is None:
                raise HTTPException(422, "Rating logic requires a rating condition")
            condition = rule.condition_rating_value
        if condition in conditions:
            raise HTTPException(422, "Each answer can have only one logic rule")
        conditions.add(condition)
        target = rule.target_question_id
        if target is not None and (
            target not in positions or positions[target] <= positions[source.id]
        ):
            raise HTTPException(
                422, "Logic targets must be later questions in this form or End form"
            )


def validate_form_logic(form: Form, positions: dict[int, int] | None = None) -> None:
    for source in form.questions:
        try:
            rules = [
                LogicRuleInput.model_validate(rule, from_attributes=True)
                for rule in source.logic_rules
            ]
        except ValidationError as error:
            raise HTTPException(
                422, "Persisted logic has an invalid condition"
            ) from error
        validate_rules(form, source, rules, positions)


def replace_rules(
    db: Session, form: Form, source: Question, rules: list[LogicRuleInput]
) -> None:
    validate_rules(form, source, rules)
    source.logic_rules.clear()
    db.flush()
    source.logic_rules.extend(LogicRule(**rule.model_dump()) for rule in rules)
    db.flush()


def next_question_id(
    source: Question, value: object, ordered: list[Question]
) -> int | None:
    for rule in source.logic_rules:
        condition = (
            rule.condition_option_id
            if rule.condition_option_id is not None
            else rule.condition_boolean_value
            if rule.condition_boolean_value is not None
            else rule.condition_rating_value
        )
        if type(value) is type(condition) and value == condition:
            return rule.target_question_id
    index = next(i for i, question in enumerate(ordered) if question.id == source.id)
    return ordered[index + 1].id if index + 1 < len(ordered) else None
