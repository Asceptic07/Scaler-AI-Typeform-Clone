import csv
from datetime import datetime, timedelta
from io import StringIO

import pytest

from tests.helpers import add_question, create_form, publish, submit


def csv_rows(response):
    return list(csv.reader(StringIO(response.text, newline="")))


@pytest.mark.parametrize("response_count", [1, 2])
def test_export_all_types_order_quoting_and_no_mutations(client, response_count):
    form = create_form(client)
    definitions = [
        ("short_text", {}),
        ("long_text", {}),
        ("multiple_choice", {"options": [{"label": 'Plan, "Pro"'}]}),
        ("dropdown", {"options": [{"label": "Design\nEngineering"}]}),
        ("email", {}),
        ("number", {}),
        ("yes_no", {}),
        ("rating", {}),
        ("short_text", {"title": "Optional question"}),
    ]
    questions = [
        add_question(client, form["id"], kind, **options)
        for kind, options in definitions
    ]
    order = [3, 0, 1, 2, 4, 5, 6, 7, 8]
    reordered = client.put(
        f"/api/forms/{form['id']}/questions/reorder",
        json={"question_ids": [questions[index]["id"] for index in order]},
    )
    assert reordered.status_code == 200
    form = publish(client, form["id"])
    values = [
        "Fran\u00e7ois",
        'First, "quoted"\nSecond line',
        questions[2]["options"][0]["id"],
        questions[3]["options"][0]["id"],
        "person@example.com",
        -12.5,
        False,
        4,
    ]
    first = submit(
        client,
        form["public_slug"],
        [
            {"question_id": questions[index]["id"], "value": value}
            for index, value in reversed(list(enumerate(values)))
        ],
    )
    assert first.status_code == 201
    if response_count == 2:
        values[0], values[5], values[6], values[7] = "Second person", 0, True, 5
        second = submit(
            client,
            form["public_slug"],
            [
                {"question_id": questions[index]["id"], "value": value}
                for index, value in enumerate(values)
            ],
        )
        assert second.status_code == 201
    path = f"/api/forms/{form['id']}"
    stored_form = client.get(path).json()
    stored_responses = client.get(path + "/responses").json()
    result = client.get(
        path + "/responses/export.csv", headers={"Origin": "http://localhost:3000"}
    )
    assert result.status_code == 200
    assert result.headers["content-type"].startswith("text/csv")
    assert result.headers["content-disposition"] == (
        f'attachment; filename="form-{form["id"]}-responses.csv"'
    )
    assert "Content-Disposition" in result.headers["access-control-expose-headers"]
    assert result.headers["cache-control"] == "no-store"
    rows = csv_rows(result)
    assert rows[0] == ["Submitted At", *[questions[i]["title"] for i in order]]
    assert len(rows) == response_count + 1
    expected = [
        "Design\nEngineering",
        "Fran\u00e7ois",
        'First, "quoted"\nSecond line',
        'Plan, "Pro"',
        "person@example.com",
        "-12.5",
        "No",
        "4",
        "",
    ]
    assert rows[-1][1:] == expected
    if response_count == 2:
        expected[1], expected[5], expected[6], expected[7] = (
            "Second person", "0.0", "Yes", "5"
        )
        assert rows[1][1:] == expected
    for row in rows[1:]:
        assert datetime.fromisoformat(row[0]).utcoffset() == timedelta(0)
    assert client.get(path).json() == stored_form
    assert client.get(path + "/responses").json() == stored_responses


@pytest.mark.parametrize(
    "text",
    ["=1+1", "+SUM(A1:A2)", "-1+2", "@SUM(A1)", "  =1", "\t=1", "\r=1", "\n=1"],
)
def test_export_sanitizes_text_headers_and_choice_labels(client, text):
    form = create_form(client)
    question = add_question(client, form["id"], title=text)
    choice = add_question(
        client, form["id"], "dropdown", options=[{"label": text}]
    )
    # Schema normalization trims whitespace in titles and option labels.
    form = publish(client, form["id"])
    assert submit(
        client,
        form["public_slug"],
        [
            {"question_id": question["id"], "value": text},
            {"question_id": choice["id"], "value": choice["options"][0]["id"]},
        ],
    ).status_code == 201
    rows = csv_rows(client.get(f"/api/forms/{form['id']}/responses/export.csv"))
    assert rows[0][1] == "'" + question["title"]
    assert rows[1][1:] == ["'" + text, "'" + choice["options"][0]["label"]]


@pytest.mark.parametrize("with_question", [False, True])
def test_export_empty_form_contains_only_header(client, with_question):
    form = create_form(client)
    titles = []
    if with_question:
        question = add_question(client, form["id"])
        titles.append(question["title"])
    response = client.get(f"/api/forms/{form['id']}/responses/export.csv")
    assert response.status_code == 200
    assert csv_rows(response) == [["Submitted At", *titles]]


def test_export_unknown_form_returns_normal_not_found(client):
    response = client.get("/api/forms/999999/responses/export.csv")
    assert response.status_code == 404
    assert response.json() == {"detail": "Form not found"}


def test_export_never_includes_another_forms_responses(client):
    forms = []
    for text in ["Own response", "Other form private answer"]:
        form = create_form(client)
        question = add_question(client, form["id"])
        form = publish(client, form["id"])
        assert submit(
            client, form["public_slug"], [{"question_id": question["id"], "value": text}]
        ).status_code == 201
        forms.append(form)
    response = client.get(f"/api/forms/{forms[0]['id']}/responses/export.csv")
    rows = csv_rows(response)
    assert len(rows) == 2
    assert rows[1][1:] == ["Own response"]
    assert "Other form private answer" not in response.text
