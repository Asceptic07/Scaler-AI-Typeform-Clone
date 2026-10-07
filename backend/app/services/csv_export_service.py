import csv
from io import StringIO

from sqlalchemy.orm import Session

from app.models import Form
from app.schemas.response import AnswerRead
from app.services.response_service import list_responses


def spreadsheet_text(value: str) -> str:
    """Neutralize formula prefixes, including those after whitespace."""
    if value.startswith(("\t", "\r", "\n")) or value.lstrip().startswith(
        ("=", "+", "-", "@")
    ):
        return "'" + value
    return value


def answer_cell(answer: AnswerRead) -> str | int | float:
    if answer.option_label is not None:
        return spreadsheet_text(answer.option_label)
    if isinstance(answer.value, str):
        return spreadsheet_text(answer.value)
    if isinstance(answer.value, bool):
        return "Yes" if answer.value else "No"
    return answer.value


def export_responses(db: Session, form: Form) -> str:
    """Export stored submissions without changing definitions or answers."""
    questions = sorted(form.questions, key=lambda question: question.position)
    output = StringIO(newline="")
    writer = csv.writer(output)
    writer.writerow(
        ["Submitted At", *(spreadsheet_text(q.title) for q in questions)]
    )
    for response in list_responses(db, form.id):
        answers = {answer.question_id: answer for answer in response.answers}
        writer.writerow(
            [response.submitted_at.isoformat().replace("+00:00", "Z")]
            + [
                answer_cell(answers[q.id]) if q.id in answers else ""
                for q in questions
            ]
        )
    return output.getvalue()
