import json

import pytest
from sqlalchemy import func, select

from app.models import Answer, Response
from tests.helpers import add_question, create_form, publish, submit


@pytest.fixture
def published_form(client):
    form = create_form(client)
    definitions = [
        ("short_text", {}),
        ("long_text", {}),
        ("email", {}),
        ("number", {}),
        ("yes_no", {}),
        ("rating", {}),
        ("multiple_choice", {"options": [{"label": "Basic"}, {"label": "Pro"}]}),
        ("dropdown", {"options": [{"label": "Design"}, {"label": "Engineering"}]}),
    ]
    questions = [
        add_question(client, form["id"], kind, required=True, **options)
        for kind, options in definitions
    ]
    form = publish(client, form["id"])
    values = [
        "Alex",
        "Useful feedback",
        "alex@example.com",
        2.5,
        False,
        4,
        questions[6]["options"][0]["id"],
        questions[7]["options"][1]["id"],
    ]
    answers = [
        {"question_id": q["id"], "value": v}
        for q, v in zip(questions, values, strict=True)
    ]
    return form, questions, answers


def test_valid_submission_results_and_statistics(client, published_form):
    form, questions, answers = published_form
    first = submit(client, form["public_slug"], answers)
    assert first.status_code == 201, first.text
    assert first.json()["submitted_at"].endswith("Z")
    second_answers = [dict(answer) for answer in answers]
    second_answers[4]["value"] = True
    second_answers[5]["value"] = 5
    second_answers[6]["value"] = questions[6]["options"][1]["id"]
    second = submit(client, form["public_slug"], second_answers)
    assert second.status_code == 201
    listing = client.get(f"/api/forms/{form['id']}/responses").json()
    assert [r["id"] for r in listing] == [second.json()["id"], first.json()["id"]]
    result = client.get(f"/api/forms/{form['id']}/responses/{first.json()['id']}")
    assert result.status_code == 200
    persisted = result.json()["answers"]
    assert [a["value"] for a in persisted] == [a["value"] for a in answers]
    assert persisted[4]["value"] is False
    assert persisted[6]["option_label"] == "Basic"
    assert persisted[7]["option_label"] == "Engineering"
    assert persisted[6]["question_title"] == questions[6]["title"]
    assert client.get(f"/api/forms/{form['id']}").json()["response_count"] == 2
    assert client.get("/api/forms").json()[0]["response_count"] == 2
    stats = client.get(f"/api/forms/{form['id']}/statistics")
    assert stats.status_code == 200, stats.text
    stats = stats.json()
    assert stats["total_response_count"] == 2
    assert [q["answered_count"] for q in stats["questions"]] == [2] * 8
    assert [d["count"] for d in stats["questions"][4]["distribution"]] == [1, 1]
    assert [d["count"] for d in stats["questions"][5]["distribution"]] == [
        0,
        0,
        0,
        1,
        1,
    ]
    assert [d["count"] for d in stats["questions"][6]["distribution"]] == [1, 1]
    assert [d["count"] for d in stats["questions"][7]["distribution"]] == [0, 2]
    assert stats["questions"][0]["distribution"] == []


@pytest.mark.parametrize(
    "index,value",
    [
        (0, 123),
        (0, " "),
        (0, "x" * 1001),
        (1, False),
        (2, "invalid-email"),
        (3, "2"),
        (3, True),
        (3, "not-a-number"),
        (3, 2**53 + 1),
        (4, "yes"),
        (4, 1),
        (5, 0),
        (5, 6),
        (5, 2.5),
        (5, True),
        (6, 999999),
        (6, "1"),
        (7, 999999),
    ],
)
def test_invalid_answer_rejected_without_partial_data(
    client, published_form, db_factory, index, value
):
    form, _, answers = published_form
    answers[index]["value"] = value
    result = submit(client, form["public_slug"], answers)
    assert result.status_code == 422, result.text
    with db_factory() as db:
        assert db.scalar(select(func.count(Response.id))) == 0
        assert db.scalar(select(func.count(Answer.id))) == 0


@pytest.mark.parametrize("value", [None, "", "   "])
def test_required_blank_values(client, published_form, value):
    form, _, answers = published_form
    answers[0]["value"] = value
    assert submit(client, form["public_slug"], answers).status_code == 422
    assert client.get(f"/api/forms/{form['id']}/responses").json() == []


def test_required_missing_question(client, published_form):
    form, _, answers = published_form
    assert submit(client, form["public_slug"], answers[:-1]).status_code == 422
    assert client.get(f"/api/forms/{form['id']}").json()["response_count"] == 0


def test_duplicate_unknown_cross_form_questions_and_options(client, published_form):
    form, questions, answers = published_form
    slug = form["public_slug"]
    assert submit(client, slug, [*answers, answers[0]]).status_code == 422
    assert (
        submit(
            client, slug, [*answers, {"question_id": 99999, "value": "X"}]
        ).status_code
        == 422
    )
    other = create_form(client)
    foreign = add_question(
        client, other["id"], "dropdown", options=[{"label": "Foreign"}]
    )
    assert (
        submit(
            client,
            slug,
            [
                *answers,
                {"question_id": foreign["id"], "value": foreign["options"][0]["id"]},
            ],
        ).status_code
        == 422
    )
    answers[6]["value"] = foreign["options"][0]["id"]
    assert submit(client, slug, answers).status_code == 422
    answers[6]["value"] = questions[7]["options"][0]["id"]
    assert submit(client, slug, answers).status_code == 422
    assert client.get(f"/api/forms/{form['id']}").json()["response_count"] == 0


@pytest.mark.parametrize("number", [float("nan"), float("inf"), float("-inf")])
def test_non_finite_numbers(client, published_form, number):
    form, _, answers = published_form
    answers[3]["value"] = number
    response = client.post(
        f"/api/public/forms/{form['public_slug']}/responses",
        content=json.dumps({"answers": answers}),
        headers={"Content-Type": "application/json"},
    )
    assert response.status_code == 422


def test_optional_empty_answers_and_zero_values(client):
    form = create_form(client)
    text = add_question(client, form["id"])
    number = add_question(client, form["id"], "number", required=True)
    boolean = add_question(client, form["id"], "yes_no", required=True)
    form = publish(client, form["id"])
    result = submit(
        client,
        form["public_slug"],
        [
            {"question_id": text["id"], "value": " "},
            {"question_id": number["id"], "value": 0},
            {"question_id": boolean["id"], "value": False},
        ],
    )
    assert result.status_code == 201
    details = client.get(
        f"/api/forms/{form['id']}/responses/{result.json()['id']}"
    ).json()
    assert len(details["answers"]) == 2
    assert details["answers"][0]["value"] == 0
    assert details["answers"][1]["value"] is False
    assert (
        client.get(f"/api/forms/{form['id']}/statistics").json()["questions"][0][
            "answered_count"
        ]
        == 0
    )


def test_response_belongs_to_requested_form(client, published_form):
    form, _, answers = published_form
    receipt = submit(client, form["public_slug"], answers).json()
    other = create_form(client)
    assert (
        client.get(f"/api/forms/{other['id']}/responses/{receipt['id']}").status_code
        == 404
    )
    assert client.get(f"/api/forms/{form['id']}/responses/99999").status_code == 404
    assert client.get("/api/forms/99999/responses").status_code == 404
    assert submit(client, "unknown-slug", answers).status_code == 404


def test_zero_response_statistics(client):
    form = create_form(client)
    add_question(client, form["id"], "rating")
    stats = client.get(f"/api/forms/{form['id']}/statistics").json()
    assert stats["total_response_count"] == 0
    assert stats["questions"][0]["answered_count"] == 0
    assert [d["count"] for d in stats["questions"][0]["distribution"]] == [0] * 5
