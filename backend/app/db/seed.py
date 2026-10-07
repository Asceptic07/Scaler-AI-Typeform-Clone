"""Idempotent sample data: run `uv run python -m app.db.seed` after migrations."""

from sqlalchemy import inspect, select, text
from sqlalchemy.orm import Session

from app.db.session import SessionLocal, engine
from app.models import Form
from app.schemas.question import QuestionCreate
from app.schemas.response import ResponseSubmit
from app.services.form_service import create_form, publish_form
from app.services.question_service import add_question
from app.services.response_service import submit_response

SAMPLES = [
    {
        "slug": "sample-product-feedback",
        "title": "Product feedback",
        "questions": [
            {"type": "short_text", "title": "What is your name?"},
            {"type": "email", "title": "What is your email address?"},
            {
                "type": "multiple_choice",
                "title": "Which plan do you prefer?",
                "options": [{"label": label} for label in ("Basic", "Pro", "Business")],
            },
            {"type": "rating", "title": "How would you rate your experience?"},
        ],
        "responses": [
            ["Alex", "alex@example.com", 0, 5],
            ["Sam", "sam@example.com", 1, 4],
            ["Taylor", "taylor@example.com", 1, 3],
        ],
    },
    {
        "slug": "sample-event-survey",
        "title": "Event survey",
        "questions": [
            {"type": "long_text", "title": "What should we improve?"},
            {
                "type": "dropdown",
                "title": "Which session did you attend?",
                "options": [
                    {"label": label} for label in ("Design", "Engineering", "Product")
                ],
            },
            {"type": "number", "title": "How many events have you attended?"},
            {"type": "yes_no", "title": "Would you attend again?"},
        ],
        "responses": [
            ["More time for questions.", 1, 2, True],
            ["Please add a beginner session.", 0, 1, False],
            ["A longer workshop would be useful.", 2, 3, True],
        ],
    },
]


def seed(db: Session) -> int:
    """Create missing samples only; never overwrite existing forms or responses."""
    created = 0
    for sample in SAMPLES:
        if (
            db.scalar(select(Form.id).where(Form.public_slug == sample["slug"]))
            is not None
        ):
            continue
        form = create_form(db, sample["title"])
        for definition in sample["questions"]:
            add_question(db, form, QuestionCreate(**definition, required=True))
        form.public_slug = sample["slug"]
        publish_form(db, form)
        for row in sample["responses"]:
            answers = []
            for question, value in zip(form.questions, row, strict=True):
                if question.options:
                    value = question.options[value].id
                answers.append({"question_id": question.id, "value": value})
            submit_response(db, form, ResponseSubmit(answers=answers))
        created += 1
    db.flush()
    return created


def main() -> None:
    if not inspect(engine).has_table("forms"):
        raise SystemExit("Run `uv run alembic upgrade head` before seeding.")
    with SessionLocal() as db:
        db.execute(text("BEGIN IMMEDIATE"))
        try:
            created = seed(db)
            db.commit()
        except Exception:
            db.rollback()
            raise
    print(f"Seed complete: {created} sample forms created; existing samples preserved.")


if __name__ == "__main__":
    main()
