import math
from typing import NoReturn

from email_validator import EmailNotValidError, validate_email
from fastapi import HTTPException
from sqlalchemy import Select, select
from sqlalchemy.orm import Session, selectinload

from app.models import Answer, Form, Question, Response
from app.models.types import CHOICE_TYPES, FormStatus, QuestionType
from app.schemas.response import AnswerRead, ResponseDetail, ResponseSubmit
from app.services.logic_service import next_question_id, validate_form_logic


def validate_answer(question: Question, value: object) -> dict[str, object] | None:
    def invalid(message: str) -> NoReturn:
        raise HTTPException(422, f"Question {question.id}: {message}")

    if value is None or (isinstance(value, str) and not value.strip()):
        if question.required:
            invalid("a valid answer is required")
        return None
    if question.type in {
        QuestionType.short_text,
        QuestionType.long_text,
        QuestionType.email,
    }:
        if not isinstance(value, str):
            invalid("expected text")
        limit = 1000 if question.type == QuestionType.short_text else 20000
        if len(value) > limit:
            invalid(f"text must be at most {limit} characters")
        if question.type == QuestionType.email:
            try:
                value = validate_email(
                    value.strip(), check_deliverability=False
                ).normalized
            except EmailNotValidError:
                invalid("invalid email address")
        return {"text_value": value}
    if question.type in CHOICE_TYPES:
        if type(value) is not int or value not in {
            option.id for option in question.options
        }:
            invalid("select one option ID belonging to this question")
        return {"option_id": value}
    if question.type == QuestionType.yes_no:
        if type(value) is not bool:
            invalid("expected a boolean")
        return {"boolean_value": value}
    if question.type == QuestionType.rating:
        if type(value) is not int or not 1 <= value <= 5:
            invalid("rating must be an integer from 1 to 5")
        return {"number_value": value}
    if question.type == QuestionType.number:
        if type(value) not in (int, float):
            invalid("expected a finite number")
        if type(value) is int and abs(value) > 2**53:
            invalid("integer exceeds the exact supported range (-2^53 to 2^53)")
        try:
            number = float(value)
        except (ValueError, OverflowError):
            invalid("number is outside the supported range")
        if not math.isfinite(number):
            invalid("expected a finite number")
        return {"number_value": number}
    invalid("unsupported question type")


def submit_response(db: Session, form: Form, data: ResponseSubmit) -> Response:
    if form.status != FormStatus.published:
        raise HTTPException(404, "Published form not found")
    questions = {q.id: q for q in form.questions}
    values: dict[int, object] = {}
    for answer in data.answers:
        if answer.question_id not in questions:
            raise HTTPException(422, "An answer refers to a question outside this form")
        if answer.question_id in values:
            raise HTTPException(
                422, "Duplicate answers to the same question are not allowed"
            )
        values[answer.question_id] = answer.value
    # Validate everything before adding a response. The caller owns one transaction.
    answers = []
    validate_form_logic(form)
    ordered = sorted(form.questions, key=lambda q: q.position)
    question_id = ordered[0].id if ordered else None
    # Only the authoritative reachable path is validated/stored. Stale answers
    # from an abandoned branch are ignored, even when those questions are required.
    while question_id is not None:
        question = questions[question_id]
        fields = validate_answer(question, values.get(question.id))
        if fields is not None:
            answers.append(Answer(question_id=question.id, **fields))
        question_id = next_question_id(question, values.get(question.id), ordered)
    response = Response(form_id=form.id, answers=answers)
    db.add(response)
    db.flush()
    return response


def response_query(form_id: int) -> Select[tuple[Response]]:
    return (
        select(Response)
        .where(Response.form_id == form_id)
        .options(
            selectinload(Response.answers).selectinload(Answer.question),
            selectinload(Response.answers).selectinload(Answer.option),
        )
    )


def serialize_response(response: Response) -> ResponseDetail:
    answers = []
    for answer in sorted(response.answers, key=lambda a: a.question.position):
        if answer.option_id is not None:
            value = answer.option_id
        elif answer.text_value is not None:
            value = answer.text_value
        elif answer.boolean_value is not None:
            value = answer.boolean_value
        else:
            value = (
                int(answer.number_value)
                if answer.question.type == QuestionType.rating
                else answer.number_value
            )
        answers.append(
            AnswerRead(
                question_id=answer.question_id,
                question_title=answer.question.title,
                question_type=answer.question.type,
                value=value,
                option_id=answer.option_id,
                option_label=answer.option.label if answer.option else None,
            )
        )
    return ResponseDetail(
        id=response.id, submitted_at=response.submitted_at, answers=answers
    )


def list_responses(db: Session, form_id: int) -> list[ResponseDetail]:
    responses = db.scalars(
        response_query(form_id).order_by(
            Response.submitted_at.desc(), Response.id.desc()
        )
    )
    return [serialize_response(response) for response in responses]


def get_response(db: Session, form_id: int, response_id: int) -> ResponseDetail:
    response = db.scalar(response_query(form_id).where(Response.id == response_id))
    if response is None:
        raise HTTPException(404, "Response not found in this form")
    return serialize_response(response)
