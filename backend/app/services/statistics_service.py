from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Answer, Form, Question, Response
from app.models.types import CHOICE_TYPES, QuestionType
from app.schemas.statistics import DistributionItem, FormStatistics, QuestionStatistics
from app.services.form_service import response_count


def get_statistics(db: Session, form: Form) -> FormStatistics:
    counts = dict(
        db.execute(
            select(Answer.question_id, func.count(Answer.id))
            .join(Response)
            .where(Response.form_id == form.id)
            .group_by(Answer.question_id)
        ).all()
    )
    # Aggregate typed columns in SQL instead of loading each submission.
    distributions = db.execute(
        select(
            Answer.question_id,
            Answer.option_id,
            Answer.boolean_value,
            Answer.number_value,
            func.count(Answer.id),
        )
        .join(Response)
        .join(Question, Answer.question_id == Question.id)
        .where(
            Response.form_id == form.id,
            Question.type.in_(
                [*CHOICE_TYPES, QuestionType.yes_no, QuestionType.rating]
            ),
        )
        .group_by(
            Answer.question_id,
            Answer.option_id,
            Answer.boolean_value,
            Answer.number_value,
        )
    ).all()
    grouped: dict[int, dict[object, int]] = {}
    for question_id, option_id, boolean, number, count in distributions:
        value = (
            option_id
            if option_id is not None
            else boolean
            if boolean is not None
            else number
        )
        grouped.setdefault(question_id, {})[value] = count
    questions = []
    for question in sorted(form.questions, key=lambda q: q.position):
        values = []
        if question.type in CHOICE_TYPES:
            values = [(o.id, o.label) for o in question.options]
        elif question.type == QuestionType.yes_no:
            values = [(True, "Yes"), (False, "No")]
        elif question.type == QuestionType.rating:
            values = [(i, str(i)) for i in range(1, 6)]
        questions.append(
            QuestionStatistics(
                question_id=question.id,
                title=question.title,
                type=question.type,
                answered_count=counts.get(question.id, 0),
                distribution=[
                    DistributionItem(
                        value=value,
                        label=label,
                        count=grouped.get(question.id, {}).get(value, 0),
                    )
                    for value, label in values
                ],
            )
        )
    return FormStatistics(
        form_id=form.id,
        total_response_count=response_count(db, form.id),
        questions=questions,
    )
