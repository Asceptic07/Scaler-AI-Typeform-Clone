from fastapi import APIRouter

from app.routes.forms import router as forms_router
from app.routes.health import router as health_router
from app.routes.public import router as public_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(forms_router)
api_router.include_router(public_router)
