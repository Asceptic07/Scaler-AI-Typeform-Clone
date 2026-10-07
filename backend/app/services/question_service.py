from datetime import UTC, datetime

from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.models import Form, Question, QuestionOption
from app.models.types import CHOICE_TYPES, FormStatus
from app.schemas.question import QuestionCreate, QuestionUpdate
from app.services.form_service import response_count, touch


def ensure_editable(db: Session, form: Form) -> None:
    if form.status == FormStatus.published or response_count(db, form.id):
        raise HTTPException(
            409,
            "Questions are locked while published or after submission; duplicate the form to revise it",
        )


def get_question(form: Form, question_id: int) -> Question:
    question = next((q for q in form.questions if q.id == question_id), None)
    if question is None:
        raise HTTPException(404, "Question not found in this form")
    return question


def add_question(db: Session, form: Form, data: QuestionCreate) -> Question:
    ensure_editable(db, form)
    question = Question(
        type=data.type,
        title=data.title,
        description=data.description,
        required=data.required,
        position=len(form.questions),
        options=[
            QuestionOption(label=option.label, position=i)
            for i, option in enumerate(data.options)
        ],
    )
    form.questions.append(question)
    touch(form)
    db.flush()
    return question


def update_question(
    db: Session, form: Form, question: Question, data: QuestionUpdate
) -> Question:
    ensure_editable(db, form)
    changes = data.model_dump(exclude_unset=True)
    merged = {
        "type": question.type,
        "title": question.title,
        "description": question.description,
        "required": question.required,
        "options": [{"label": o.label} for o in question.options],
    }
    merged.update(changes)
    if merged["type"] not in CHOICE_TYPES and "options" not in changes:
        merged["options"] = []
    try:
        validated = QuestionCreate.model_validate(merged)
    except ValidationError as error:
        raise HTTPException(422, "; ".join(e["msg"] for e in error.errors())) from error
    question.type = validated.type
    question.title = validated.title
    question.description = validated.description
    question.required = validated.required
    question.updated_at = datetime.now(UTC)
    # Do not replace option IDs on a title/description-only update.
    if "options" in changes or (
        validated.type not in CHOICE_TYPES and question.options
    ):
        question.options.clear()
        db.flush()
        question.options.extend(
            QuestionOption(label=o.label, position=i)
            for i, o in enumerate(validated.options)
        )
    touch(form)
    db.flush()
    return question


def set_positions(db: Session, ordered: list[Question]) -> None:
    # SQLite checks uniqueness immediately; move aside before swapping positions.
    offset = max((q.position for q in ordered), default=0) + len(ordered) + 1
    for index, question in enumerate(ordered):
        question.position = offset + index
    db.flush()
    for index, question in enumerate(ordered):
        question.position = index
    db.flush()


def delete_question(db: Session, form: Form, question: Question) -> None:
    ensure_editable(db, form)
    form.questions.remove(question)
    db.flush()
    set_positions(db, sorted(form.questions, key=lambda q: q.position))
    touch(form)
    db.flush()


def reorder_questions(db: Session, form: Form, ids: list[int]) -> None:
    ensure_editable(db, form)
    questions = {question.id: question for question in form.questions}
    if len(ids) != len(set(ids)) or set(ids) != set(questions):
        raise HTTPException(422, "Provide every question ID in this form exactly once")
    set_positions(db, [questions[question_id] for question_id in ids])
    touch(form)
    db.flush()
