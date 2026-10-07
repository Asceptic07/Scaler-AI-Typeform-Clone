from collections.abc import Generator
from pathlib import Path

import pytest
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session, sessionmaker

from alembic import command
from app.core.config import BACKEND_DIR, Settings
from app.db import session as db_session
from app.main import create_app


@pytest.fixture
def db_factory(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> Generator[sessionmaker[Session], None, None]:
    # Every test starts with the real migration on a separate temporary SQLite file.
    engine = db_session.create_db_engine(
        f"sqlite:///{(tmp_path / 'test.db').as_posix()}"
    )
    config = Config(str(BACKEND_DIR / "alembic.ini"))
    with engine.connect() as connection:
        config.attributes["connection"] = connection
        command.upgrade(config, "head")
    factory = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    monkeypatch.setattr(db_session, "SessionLocal", factory)
    yield factory
    engine.dispose()


@pytest.fixture
def client(db_factory: sessionmaker[Session]) -> Generator[TestClient, None, None]:
    settings = Settings(_env_file=None, app_name="Typeform Clone API")
    with TestClient(create_app(settings)) as test_client:
        yield test_client
