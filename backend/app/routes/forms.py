from fastapi import APIRouter, Response

from app.api.dependencies import ReadDB, WriteDB
from app.models.types import FormStatus
from app.schemas.form import FormCreate, FormDetail, FormSummary, FormUpdate
from app.schemas.logic import LogicReplace
from app.schemas.question import (
    QuestionCreate,
    QuestionRead,
    QuestionReorder,
    QuestionUpdate,
)
from app.schemas.response import ResponseDetail
from app.schemas.statistics import FormStatistics
from app.services import form_service as forms
from app.services import question_service as questions
from app.services import response_service as responses
from app.services.csv_export_service import export_responses
from app.services.logic_service import replace_rules
from app.services.statistics_service import get_statistics

router = APIRouter(prefix="/api/forms", tags=["forms"])


@router.post(
    "", response_model=FormDetail, status_code=201, summary="Create a draft form"
)
def create_form(data: FormCreate, db: WriteDB) -> FormDetail:
    return forms.detail(db, forms.create_form(db, data.title))


@router.get(
    "", response_model=list[FormSummary], summary="List forms with response counts"
)
def list_forms(db: ReadDB) -> list[FormSummary]:
    return forms.list_forms(db)


@router.get(
    "/{form_id}", response_model=FormDetail, summary="Get an ordered form definition"
)
def get_form(form_id: int, db: ReadDB) -> FormDetail:
    return forms.detail(db, forms.get_form(db, form_id))


@router.patch("/{form_id}", response_model=FormDetail, summary="Rename a form")
def rename_form(form_id: int, data: FormUpdate, db: WriteDB) -> FormDetail:
    form = forms.get_form(db, form_id)
    form.title = data.title
    forms.touch(form)
    return forms.detail(db, form)


@router.delete(
    "/{form_id}", status_code=204, summary="Delete a form and all dependent data"
)
def delete_form(form_id: int, db: WriteDB) -> Response:
    db.delete(forms.get_form(db, form_id))
    db.flush()
    return Response(status_code=204)


@router.post(
    "/{form_id}/duplicate",
    response_model=FormDetail,
    status_code=201,
    summary="Duplicate a form without submissions or publication",
)
def duplicate_form(form_id: int, db: WriteDB) -> FormDetail:
    return forms.detail(db, forms.duplicate_form(db, forms.get_form(db, form_id)))


@router.post(
    "/{form_id}/publish",
    response_model=FormDetail,
    summary="Publish a form and allocate a stable random public slug",
)
def publish_form(form_id: int, db: WriteDB) -> FormDetail:
    form = forms.get_form(db, form_id)
    forms.publish_form(db, form)
    return forms.detail(db, form)


@router.post(
    "/{form_id}/unpublish",
    response_model=FormDetail,
    summary="Unpublish a form while retaining its public slug",
)
def unpublish_form(form_id: int, db: WriteDB) -> FormDetail:
    form = forms.get_form(db, form_id)
    form.status = FormStatus.draft
    forms.touch(form)
    return forms.detail(db, form)


@router.post(
    "/{form_id}/questions",
    response_model=QuestionRead,
    status_code=201,
    tags=["questions"],
    summary="Append a question to an editable draft",
)
def create_question(form_id: int, data: QuestionCreate, db: WriteDB) -> QuestionRead:
    return QuestionRead.model_validate(
        questions.add_question(db, forms.get_form(db, form_id), data)
    )


@router.put(
    "/{form_id}/questions/{question_id}/logic",
    response_model=QuestionRead,
    tags=["questions"],
)
def save_logic(
    form_id: int, question_id: int, data: LogicReplace, db: WriteDB
) -> QuestionRead:
    form = forms.get_form(db, form_id)
    source = questions.get_question(form, question_id)
    questions.ensure_editable(db, form)
    replace_rules(db, form, source, data.rules)
    forms.touch(form)
    db.flush()
    return QuestionRead.model_validate(source)


@router.put(
    "/{form_id}/questions/reorder",
    response_model=FormDetail,
    tags=["questions"],
    summary="Set the complete question order transactionally",
)
def reorder_questions(form_id: int, data: QuestionReorder, db: WriteDB) -> FormDetail:
    form = forms.get_form(db, form_id)
    questions.reorder_questions(db, form, data.question_ids)
    return forms.detail(db, form)


@router.patch(
    "/{form_id}/questions/{question_id}",
    response_model=QuestionRead,
    tags=["questions"],
    summary="Update question configuration on an editable draft",
)
def update_question(
    form_id: int, question_id: int, data: QuestionUpdate, db: WriteDB
) -> QuestionRead:
    form = forms.get_form(db, form_id)
    return QuestionRead.model_validate(
        questions.update_question(
            db, form, questions.get_question(form, question_id), data
        )
    )


@router.delete(
    "/{form_id}/questions/{question_id}",
    status_code=204,
    tags=["questions"],
    summary="Delete a question and compact its form's ordering",
)
def delete_question(form_id: int, question_id: int, db: WriteDB) -> Response:
    form = forms.get_form(db, form_id)
    questions.delete_question(db, form, questions.get_question(form, question_id))
    return Response(status_code=204)


@router.get(
    "/{form_id}/responses",
    response_model=list[ResponseDetail],
    tags=["results"],
    summary="List responses newest first with answer summaries",
)
def list_responses(form_id: int, db: ReadDB) -> list[ResponseDetail]:
    forms.get_form(db, form_id)
    return responses.list_responses(db, form_id)


@router.get(
    "/{form_id}/responses/export.csv",
    response_class=Response,
    tags=["results"],
    summary="Download persisted responses as CSV",
)
def export_csv(form_id: int, db: ReadDB) -> Response:
    form = forms.get_form(db, form_id)
    return Response(
        content=export_responses(db, form),
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="form-{form.id}-responses.csv"',
            "Cache-Control": "no-store",
        },
    )


@router.get(
    "/{form_id}/responses/{response_id}",
    response_model=ResponseDetail,
    tags=["results"],
    summary="Get a submission including question text and selected labels",
)
def get_response(form_id: int, response_id: int, db: ReadDB) -> ResponseDetail:
    forms.get_form(db, form_id)
    return responses.get_response(db, form_id, response_id)


@router.get(
    "/{form_id}/statistics",
    response_model=FormStatistics,
    tags=["results"],
    summary="Get response counts and per-question distributions",
)
def statistics(form_id: int, db: ReadDB) -> FormStatistics:
    return get_statistics(db, forms.get_form(db, form_id))
