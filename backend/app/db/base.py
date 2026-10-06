from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Shared metadata for future SQLAlchemy models and Alembic."""
