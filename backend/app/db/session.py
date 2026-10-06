from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings

database_url = get_settings().database_url
connect_args = (
    {"check_same_thread": False}
    if make_url(database_url).get_backend_name() == "sqlite"
    else {}
)
# Engine construction is lazy: no connection or database file is opened here.
engine = create_engine(database_url, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Generator[Session, None, None]:
    """Provide one session per request; callers own transaction commits."""
    with SessionLocal() as session:
        yield session
