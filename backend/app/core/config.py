from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import make_url

BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Typeform Clone API"
    app_env: str = "development"
    database_url: str = "sqlite:///./typeform_clone.db"
    frontend_origin: str = "http://localhost:3000"

    @field_validator("database_url")
    @classmethod
    def resolve_sqlite_path(cls, value: str) -> str:
        """Resolve relative SQLite files from backend/ for API and migrations."""
        url = make_url(value)
        if url.get_backend_name() == "sqlite" and url.database not in (
            None,
            "",
            ":memory:",
        ):
            path = Path(url.database)
            if not path.is_absolute():
                url = url.set(database=(BACKEND_DIR / path).resolve().as_posix())
                return url.render_as_string(hide_password=False)
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
