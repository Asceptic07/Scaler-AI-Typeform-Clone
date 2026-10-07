from datetime import UTC, datetime
from secrets import token_urlsafe

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models import Form, Question, Response
from app.models.types import FormStatus
from app.schemas.form import FormDetail, FormSummary
from app.schemas.question import QuestionCreate, QuestionRead


def get_form(db: Session, form_id: int) -> Form:
    form = db.scalar(
        select(Form)
        .where(Form.id == form_id)
        .options(selectinload(Form.questions).selectinload(Question.options))
    )
    if form is None:
        raise HTTPException(404, "Form not found")
    return form


def get_public_form(db: Session, public_slug: str) -> Form:
    form = db.scalar(
        select(Form)
        .where(Form.public_slug == public_slug, Form.status == FormStatus.published)
        .options(selectinload(Form.questions).selectinload(Question.options))
    )
    if form is None:
        raise HTTPException(404, "Published form not found")
    return form


def response_count(db: Session, form_id: int) -> int:
    return (
        db.scalar(select(func.count(Response.id)).where(Response.form_id == form_id))
        or 0
    )


def touch(form: Form) -> None:
    form.updated_at = datetime.now(UTC)


def summary(form: Form, count: int) -> FormSummary:
    return FormSummary(
        id=form.id,
        title=form.title,
        status=form.status,
        public_slug=form.public_slug,
        created_at=form.created_at,
        updated_at=form.updated_at,
        response_count=count,
    )


def detail(db: Session, form: Form) -> FormDetail:
    db.flush()
    return FormDetail(
        **summary(form, response_count(db, form.id)).model_dump(),
        questions=[
            QuestionRead.model_validate(q)
            for q in sorted(form.questions, key=lambda q: q.position)
        ],
    )


def list_forms(db: Session) -> list[FormSummary]:
    rows = db.execute(
        select(Form, func.count(Response.id))
        .outerjoin(Response, Response.form_id == Form.id)
        .group_by(Form.id)
        .order_by(Form.created_at.desc(), Form.id.desc())
    )
    return [summary(form, count) for form, count in rows]


def create_form(db: Session, title: str) -> Form:
    form = Form(title=title)
    db.add(form)
    db.flush()
    return form


def duplicate_form(db: Session, original: Form) -> Form:
    from app.services.question_service import add_question

    duplicate = create_form(db, f"{original.title[:195]} Copy")
    for question in sorted(original.questions, key=lambda q: q.position):
        add_question(
            db,
            duplicate,
            QuestionCreate(
                type=question.type,
                title=question.title,
                description=question.description,
                required=question.required,
                options=[{"label": o.label} for o in question.options],
            ),
        )
    return duplicate


def publish_form(db: Session, form: Form) -> None:
    if not form.questions:
        raise HTTPException(400, "Add at least one question before publishing")
    for question in form.questions:
        QuestionCreate(
            type=question.type,
            title=question.title,
            description=question.description,
            required=question.required,
            options=[{"label": o.label} for o in question.options],
        )
    if form.public_slug is None:
        # Writers are serialized before this check for local SQLite.
        slug = token_urlsafe(24)
        while db.scalar(select(Form.id).where(Form.public_slug == slug)) is not None:
            slug = token_urlsafe(24)
        form.public_slug = slug
    form.status = FormStatus.published
    touch(form)
    db.flush()
