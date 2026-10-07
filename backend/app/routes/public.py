from fastapi import APIRouter

from app.api.dependencies import ReadDB, WriteDB
from app.schemas.form import PublicForm
from app.schemas.response import ResponseReceipt, ResponseSubmit
from app.services.form_service import get_public_form
from app.services.response_service import submit_response

router = APIRouter(prefix="/api/public/forms", tags=["public forms"])


@router.get(
    "/{public_slug}",
    response_model=PublicForm,
    summary="Retrieve a published form without submission metadata",
)
def get_form(public_slug: str, db: ReadDB) -> PublicForm:
    return PublicForm.model_validate(get_public_form(db, public_slug))


@router.post(
    "/{public_slug}/responses",
    response_model=ResponseReceipt,
    status_code=201,
    summary="Validate and atomically persist a submission",
)
def submit(public_slug: str, data: ResponseSubmit, db: WriteDB) -> ResponseReceipt:
    response = submit_response(db, get_public_form(db, public_slug), data)
    return ResponseReceipt.model_validate(response)
