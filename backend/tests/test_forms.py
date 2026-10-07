from sqlalchemy import func, select

from app.models import Answer, Form, Question, QuestionOption, Response
from tests.helpers import add_question, create_form, publish, submit


def test_form_create_list_rename(client):
    form = create_form(client, "  Original title  ")
    assert form["title"] == "Original title"
    assert form["status"] == "draft"
    assert form["public_slug"] is None
    assert form["questions"] == []
    assert form["response_count"] == 0
    listed = client.get("/api/forms").json()
    assert len(listed) == 1 and listed[0]["id"] == form["id"]
    renamed = client.patch(f"/api/forms/{form['id']}", json={"title": "Renamed"})
    assert renamed.status_code == 200
    assert renamed.json()["title"] == "Renamed"
    assert client.get(f"/api/forms/{form['id']}").json()["title"] == "Renamed"


def test_invalid_and_unknown_forms(client):
    for title in ("", "   ", "a" * 201, None):
        assert client.post("/api/forms", json={"title": title}).status_code == 422
    assert (
        client.post(
            "/api/forms", json={"title": "X", "status": "published"}
        ).status_code
        == 422
    )
    assert client.get("/api/forms/999").status_code == 404
    assert client.patch("/api/forms/999", json={"title": "X"}).status_code == 404
    assert client.delete("/api/forms/999").status_code == 404


def test_duplicate_excludes_responses_and_publication(client):
    original = create_form(client)
    first = add_question(
        client,
        original["id"],
        "multiple_choice",
        required=True,
        description="Choose one",
        options=[{"label": "A"}, {"label": "B"}],
    )
    second = add_question(client, original["id"], "rating")
    form = publish(client, original["id"])
    assert (
        submit(
            client,
            form["public_slug"],
            [{"question_id": first["id"], "value": first["options"][0]["id"]}],
        ).status_code
        == 201
    )
    response = client.post(f"/api/forms/{form['id']}/duplicate")
    assert response.status_code == 201
    duplicate = response.json()
    assert duplicate["title"] == "Test form Copy"
    assert duplicate["status"] == "draft" and duplicate["public_slug"] is None
    assert duplicate["response_count"] == 0
    assert client.get(f"/api/forms/{duplicate['id']}/responses").json() == []
    assert [q["position"] for q in duplicate["questions"]] == [0, 1]
    copied = duplicate["questions"][0]
    assert copied["id"] != first["id"]
    assert copied["description"] == "Choose one" and copied["required"] is True
    assert [o["label"] for o in copied["options"]] == ["A", "B"]
    assert copied["options"][0]["id"] != first["options"][0]["id"]
    assert duplicate["questions"][1]["rating_max"] == second["rating_max"] == 5


def test_form_delete_cascades_all_records(client, db_factory):
    form = create_form(client)
    question = add_question(client, form["id"], "dropdown", options=[{"label": "A"}])
    form = publish(client, form["id"])
    assert (
        submit(
            client,
            form["public_slug"],
            [{"question_id": question["id"], "value": question["options"][0]["id"]}],
        ).status_code
        == 201
    )
    assert client.delete(f"/api/forms/{form['id']}").status_code == 204
    assert client.get(f"/api/public/forms/{form['public_slug']}").status_code == 404
    with db_factory() as db:
        for model in (Form, Question, QuestionOption, Response, Answer):
            assert db.scalar(select(func.count()).select_from(model)) == 0


def test_publish_unpublish_republish(client):
    form = create_form(client)
    assert client.post(f"/api/forms/{form['id']}/publish").status_code == 400
    question = add_question(client, form["id"])
    form = publish(client, form["id"])
    slug = form["public_slug"]
    assert len(slug) >= 24
    public = client.get(f"/api/public/forms/{slug}")
    assert public.status_code == 200
    assert set(public.json()) == {"id", "public_slug", "title", "questions"}
    assert public.json()["questions"][0]["id"] == question["id"]
    assert publish(client, form["id"])["public_slug"] == slug
    unpublished = client.post(f"/api/forms/{form['id']}/unpublish").json()
    assert unpublished["status"] == "draft" and unpublished["public_slug"] == slug
    assert client.get(f"/api/public/forms/{slug}").status_code == 404
    assert submit(client, slug, []).status_code == 404
    assert publish(client, form["id"])["public_slug"] == slug


def test_openapi_has_request_and_response_schemas(client):
    assert client.get("/docs").status_code == 200
    spec = client.get("/openapi.json").json()
    assert {
        "/health",
        "/api/forms",
        "/api/forms/{form_id}",
        "/api/forms/{form_id}/questions/reorder",
        "/api/forms/{form_id}/statistics",
        "/api/public/forms/{public_slug}",
        "/api/public/forms/{public_slug}/responses",
    } <= spec["paths"].keys()
    operation = spec["paths"]["/api/public/forms/{public_slug}/responses"]["post"]
    assert operation["requestBody"]["content"]["application/json"]["schema"][
        "$ref"
    ].endswith("ResponseSubmit")
    assert operation["responses"]["201"]["content"]["application/json"]["schema"][
        "$ref"
    ].endswith("ResponseReceipt")
