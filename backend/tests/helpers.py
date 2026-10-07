from fastapi.testclient import TestClient


def create_form(client: TestClient, title: str = "Test form") -> dict:
    response = client.post("/api/forms", json={"title": title})
    assert response.status_code == 201, response.text
    return response.json()


def add_question(
    client: TestClient, form_id: int, question_type: str = "short_text", **kwargs
) -> dict:
    response = client.post(
        f"/api/forms/{form_id}/questions",
        json={"type": question_type, "title": f"Question {question_type}", **kwargs},
    )
    assert response.status_code == 201, response.text
    return response.json()


def publish(client: TestClient, form_id: int) -> dict:
    response = client.post(f"/api/forms/{form_id}/publish")
    assert response.status_code == 200, response.text
    return response.json()


def submit(client: TestClient, slug: str, answers: list[dict]):
    return client.post(f"/api/public/forms/{slug}/responses", json={"answers": answers})
