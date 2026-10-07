from collections.abc import Generator
from sqlite3 import Connection as SQLiteConnection

from sqlalchemy import create_engine, event, text
from sqlalchemy.engine import Engine, make_url
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import ConnectionPoolEntry

from app.core.config import get_settings


def create_db_engine(database_url: str, **kwargs: object) -> Engine:
    """Enable SQLite FK enforcement for API, migrations, and tests."""
    sqlite = make_url(database_url).get_backend_name() == "sqlite"
    connect_args = {"check_same_thread": False, "timeout": 15} if sqlite else {}
    db_engine = create_engine(database_url, connect_args=connect_args, **kwargs)
    if sqlite:

        @event.listens_for(db_engine, "connect")
        def enable_foreign_keys(
            connection: SQLiteConnection, _record: ConnectionPoolEntry
        ) -> None:
            cursor = connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()

    return db_engine


# Engine construction is lazy: no connection or database file is opened here.
engine = create_db_engine(get_settings().database_url)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Generator[Session, None, None]:
    """Provide one session per request; callers own transaction commits."""
    with SessionLocal() as session:
        yield session


def get_write_db() -> Generator[Session, None, None]:
    """Serialize SQLite writers before validation to protect publish/history races."""
    with SessionLocal() as session:
        if session.bind.dialect.name == "sqlite":
            session.execute(text("BEGIN IMMEDIATE"))
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
