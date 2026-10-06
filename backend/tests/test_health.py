from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import create_app


def test_health() -> None:
    settings = Settings(
        _env_file=None,
        app_name="Typeform Clone API",
        database_url="sqlite:///:memory:",
    )
    with TestClient(create_app(settings)) as client:
        response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "Typeform Clone API"}
