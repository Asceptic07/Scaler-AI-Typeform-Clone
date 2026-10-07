import pytest
from sqlalchemy import func, select

from app.models import QuestionOption
from tests.helpers import add_question, create_form, publish, submit


def test_question_update_delete_and_option_cleanup(client, db_factory):
    form = create_form(client)
    q = add_question(
        client, form["id"], "multiple_choice", options=[{"label": "A"}, {"label": "B"}]
    )
    second = add_question(client, form["id"])
    path = f"/api/forms/{form['id']}/questions/{q['id']}"
    updated = client.patch(
        path, json={"title": "Updated", "description": "Help", "required": True}
    )
    assert updated.status_code == 200
    assert updated.json()["options"] == q["options"]
    replaced = client.patch(path, json={"options": [{"label": "C"}]})
    assert replaced.status_code == 200
    assert [o["label"] for o in replaced.json()["options"]] == ["C"]
    changed_type = client.patch(path, json={"type": "short_text", "description": None})
    assert changed_type.status_code == 200
    assert (
        changed_type.json()["options"] == []
        and changed_type.json()["description"] is None
    )
    with db_factory() as db:
        assert db.scalar(select(func.count(QuestionOption.id))) == 0
    assert client.delete(path).status_code == 204
    detail = client.get(f"/api/forms/{form['id']}").json()
    assert [(q["id"], q["position"]) for q in detail["questions"]] == [
        (second["id"], 0)
    ]
    assert add_question(client, form["id"])["position"] == 1


@pytest.mark.parametrize(
    "data",
    [
        {"type": "multiple_choice"},
        {"type": "dropdown", "options": []},
        {"type": "short_text", "options": [{"label": "A"}]},
        {"type": "dropdown", "options": [{"label": " "}]},
        {"type": "dropdown", "options": [{"label": "A"}, {"label": "A"}]},
        {"type": "invalid"},
        {"type": "rating", "rating_max": 10},
    ],
)
def test_invalid_question_configuration(client, data):
    form = create_form(client)
    assert (
        client.post(
            f"/api/forms/{form['id']}/questions", json={"title": "Question", **data}
        ).status_code
        == 422
    )
    assert client.get(f"/api/forms/{form['id']}").json()["questions"] == []


def test_invalid_question_patch_rolls_back(client):
    form = create_form(client)
    question = add_question(client, form["id"])
    path = f"/api/forms/{form['id']}/questions/{question['id']}"
    for update in (
        {"type": "dropdown"},
        {"title": None},
        {"required": None},
        {"options": None},
    ):
        assert client.patch(path, json=update).status_code == 422
    assert client.get(f"/api/forms/{form['id']}").json()["questions"][0] == question


def test_question_reordering_and_invalid_orders(client):
    form = create_form(client)
    ids = [add_question(client, form["id"])["id"] for _ in range(3)]
    another = create_form(client)
    foreign_id = add_question(client, another["id"])["id"]
    path = f"/api/forms/{form['id']}/questions/reorder"
    for order in (
        ids[:2],
        [ids[0], ids[0], ids[2]],
        [*ids[:2], foreign_id],
        [*ids, 999],
        [],
    ):
        assert client.put(path, json={"question_ids": order}).status_code == 422
        assert [
            q["id"] for q in client.get(f"/api/forms/{form['id']}").json()["questions"]
        ] == ids
    reordered = client.put(path, json={"question_ids": ids[::-1]})
    assert reordered.status_code == 200
    assert [q["id"] for q in reordered.json()["questions"]] == ids[::-1]
    assert [q["position"] for q in reordered.json()["questions"]] == [0, 1, 2]


def test_cross_form_question_access(client):
    form = create_form(client)
    other = create_form(client)
    question = add_question(client, other["id"])
    path = f"/api/forms/{form['id']}/questions/{question['id']}"
    assert client.patch(path, json={"title": "Changed"}).status_code == 404
    assert client.delete(path).status_code == 404


def test_question_history_policy(client):
    form = create_form(client)
    question = add_question(client, form["id"])
    form = publish(client, form["id"])
    path = f"/api/forms/{form['id']}/questions"
    for has_response in (False, True):
        if has_response:
            assert (
                submit(
                    client,
                    form["public_slug"],
                    [{"question_id": question["id"], "value": "Original answer"}],
                ).status_code
                == 201
            )
            assert client.post(f"/api/forms/{form['id']}/unpublish").status_code == 200
        assert (
            client.post(path, json={"type": "short_text", "title": "New"}).status_code
            == 409
        )
        assert (
            client.patch(
                f"{path}/{question['id']}", json={"title": "Changed"}
            ).status_code
            == 409
        )
        assert client.delete(f"{path}/{question['id']}").status_code == 409
        assert (
            client.put(
                f"{path}/reorder", json={"question_ids": [question["id"]]}
            ).status_code
            == 409
        )
    result = client.get(f"/api/forms/{form['id']}/responses").json()[0]
    assert result["answers"][0]["question_title"] == question["title"]
    assert result["answers"][0]["value"] == "Original answer"


def test_unpublish_without_responses_unlocks_questions(client):
    form = create_form(client)
    question = add_question(client, form["id"])
    publish(client, form["id"])
    client.post(f"/api/forms/{form['id']}/unpublish")
    assert (
        client.patch(
            f"/api/forms/{form['id']}/questions/{question['id']}",
            json={"title": "Changed"},
        ).status_code
        == 200
    )
