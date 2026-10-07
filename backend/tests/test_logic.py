import csv
from io import StringIO

import pytest
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError

from app.models import LogicRule
from tests.helpers import add_question, create_form, publish, submit


def save(client, form, question, rules):
    return client.put(
        f"/api/forms/{form['id']}/questions/{question['id']}/logic",
        json={"rules": rules},
    )


def boolean_rule(value, target=None):
    return {"condition_boolean_value": value, "target_question_id": target}


def branch_form(client):
    form = create_form(client)
    questions = [
        add_question(client, form["id"], "yes_no", required=True),
        add_question(client, form["id"], "short_text", required=True),
        add_question(client, form["id"], "rating", required=True),
        add_question(client, form["id"], "long_text"),
    ]
    return form, questions


@pytest.mark.parametrize("kind", ["multiple_choice", "dropdown", "yes_no", "rating"])
def test_supported_logic_replacement_and_public_definition(client, kind):
    form = create_form(client)
    options = (
        {"options": [{"label": "A"}, {"label": "B"}]}
        if kind in {"multiple_choice", "dropdown"}
        else {}
    )
    source = add_question(client, form["id"], kind, **options)
    target = add_question(client, form["id"])
    if kind in {"multiple_choice", "dropdown"}:
        conditions = [
            {"condition_option_id": option["id"]} for option in source["options"]
        ]
    elif kind == "yes_no":
        conditions = [
            {"condition_boolean_value": True},
            {"condition_boolean_value": False},
        ]
    else:
        conditions = [{"condition_rating_value": 1}, {"condition_rating_value": 5}]
    rules = [
        {**conditions[0], "target_question_id": target["id"]},
        {**conditions[1], "target_question_id": None},
    ]
    result = save(client, form, source, rules)
    assert result.status_code == 200, result.text
    assert len(result.json()["logic_rules"]) == 2
    assert save(client, form, source, []).json()["logic_rules"] == []
    saved = save(client, form, source, rules).json()["logic_rules"]
    form = publish(client, form["id"])
    public = client.get(f"/api/public/forms/{form['public_slug']}").json()
    assert public["questions"][0]["logic_rules"] == saved
    assert "created_at" not in saved[0] and "source_question_id" not in saved[0]
    # All four supported condition types are evaluated by the submission service.
    field, value = next(iter(conditions[1].items()))
    receipt = submit(
        client, form["public_slug"], [{"question_id": source["id"], "value": value}]
    )
    assert receipt.status_code == 201, (field, receipt.text)
    answers = client.get(f"/api/forms/{form['id']}/responses").json()[0]["answers"]
    assert [answer["question_id"] for answer in answers] == [source["id"]]


@pytest.mark.parametrize("kind", ["short_text", "long_text", "email", "number"])
def test_unsupported_source_types_rejected(client, kind):
    form = create_form(client)
    source = add_question(client, form["id"], kind)
    assert save(client, form, source, [boolean_rule(True)]).status_code == 422
    assert save(client, form, source, []).status_code == 200


def test_foreign_conditions_targets_and_unknown_source_rejected_atomically(client):
    form, questions = branch_form(client)
    other = create_form(client)
    foreign = add_question(
        client, other["id"], "dropdown", options=[{"label": "Foreign"}]
    )
    own_choice = add_question(
        client, form["id"], "dropdown", options=[{"label": "Own"}]
    )
    source = questions[0]
    valid = [boolean_rule(True, questions[2]["id"])]
    assert save(client, form, source, valid).status_code == 200
    for rules in [
        [boolean_rule(True, source["id"])],
        [boolean_rule(True, foreign["id"])],
        [
            {
                "condition_option_id": own_choice["options"][0]["id"],
                "target_question_id": None,
            }
        ],
        [boolean_rule(True), boolean_rule(True, questions[3]["id"])],
    ]:
        assert save(client, form, source, rules).status_code == 422
        assert (
            len(
                client.get(f"/api/forms/{form['id']}").json()["questions"][0][
                    "logic_rules"
                ]
            )
            == 1
        )
    assert (
        save(
            client,
            form,
            questions[2],
            [{"condition_rating_value": 1, "target_question_id": source["id"]}],
        ).status_code
        == 422
    )
    for option in [foreign["options"][0]["id"], own_choice["options"][0]["id"]]:
        local = add_question(
            client, form["id"], "multiple_choice", options=[{"label": "Local"}]
        )
        assert (
            save(
                client,
                form,
                local,
                [{"condition_option_id": option, "target_question_id": None}],
            ).status_code
            == 422
        )
    assert save(client, form, foreign, []).status_code == 404
    assert save(client, {"id": 999999}, source, []).status_code == 404


@pytest.mark.parametrize(
    "rule",
    [
        {"target_question_id": None},
        {"condition_boolean_value": True},
        {"condition_boolean_value": 1, "target_question_id": None},
        {"condition_boolean_value": "false", "target_question_id": None},
        {
            "condition_boolean_value": True,
            "condition_rating_value": 1,
            "target_question_id": None,
        },
        {"condition_rating_value": 0, "target_question_id": None},
        {"condition_rating_value": 6, "target_question_id": None},
        {"condition_rating_value": 1.5, "target_question_id": None},
        {"condition_rating_value": True, "target_question_id": None},
        {"condition_boolean_value": True, "target_question_id": "1"},
        {
            "condition_boolean_value": True,
            "target_question_id": None,
            "operator": "contains",
        },
    ],
)
def test_malformed_rule_payloads_rejected(client, rule):
    form, questions = branch_form(client)
    assert save(client, form, questions[0], [rule]).status_code == 422


def test_jump_skips_required_stale_answers_and_results_statistics_csv(client):
    form, questions = branch_form(client)
    assert (
        save(
            client,
            form,
            questions[0],
            [boolean_rule(True, questions[2]["id"]), boolean_rule(False)],
        ).status_code
        == 200
    )
    form = publish(client, form["id"])
    # The invalid skipped value must neither fail validation nor get stored.
    result = submit(
        client,
        form["public_slug"],
        [
            {"question_id": questions[0]["id"], "value": True},
            {"question_id": questions[1]["id"], "value": False},
            {"question_id": questions[2]["id"], "value": 4},
            {"question_id": questions[3]["id"], "value": "Visited"},
        ],
    )
    assert result.status_code == 201, result.text
    early = submit(
        client,
        form["public_slug"],
        [
            {"question_id": questions[0]["id"], "value": False},
            {"question_id": questions[2]["id"], "value": "Old abandoned branch"},
        ],
    )
    assert early.status_code == 201, early.text
    responses = client.get(f"/api/forms/{form['id']}/responses").json()
    assert [answer["question_id"] for answer in responses[0]["answers"]] == [
        questions[0]["id"]
    ]
    assert [answer["question_id"] for answer in responses[1]["answers"]] == [
        questions[i]["id"] for i in [0, 2, 3]
    ]
    stats = client.get(f"/api/forms/{form['id']}/statistics").json()
    assert [q["answered_count"] for q in stats["questions"]] == [2, 0, 1, 1]
    assert [d["count"] for d in stats["questions"][2]["distribution"]] == [
        0,
        0,
        0,
        1,
        0,
    ]
    rows = list(
        csv.reader(
            StringIO(client.get(f"/api/forms/{form['id']}/responses/export.csv").text)
        )
    )
    assert rows[1][1:] == ["No", "", "", ""]
    assert rows[2][1:] == ["Yes", "", "4", "Visited"]


@pytest.mark.parametrize("clear_rules", [False, True])
def test_no_match_and_cleared_rules_keep_sequential_required_validation(
    client, clear_rules
):
    form, questions = branch_form(client)
    save(client, form, questions[0], [boolean_rule(True, questions[2]["id"])])
    if clear_rules:
        assert save(client, form, questions[0], []).status_code == 200
    form = publish(client, form["id"])
    answers = [
        {"question_id": questions[0]["id"], "value": False},
        {"question_id": questions[2]["id"], "value": 3},
    ]
    assert submit(client, form["public_slug"], answers).status_code == 422
    assert (
        submit(
            client,
            form["public_slug"],
            [*answers, {"question_id": questions[1]["id"], "value": "Required"}],
        ).status_code
        == 201
    )


@pytest.mark.parametrize("deletion", ["source", "target", "option", "form"])
def test_rule_cascades_on_definition_deletion(client, db_factory, deletion):
    form = create_form(client)
    source = add_question(
        client, form["id"], "dropdown", options=[{"label": "A"}, {"label": "B"}]
    )
    target = add_question(client, form["id"])
    save(
        client,
        form,
        source,
        [
            {
                "condition_option_id": source["options"][0]["id"],
                "target_question_id": target["id"],
            }
        ],
    )
    if deletion == "form":
        assert client.delete(f"/api/forms/{form['id']}").status_code == 204
    elif deletion == "option":
        result = client.patch(
            f"/api/forms/{form['id']}/questions/{source['id']}",
            json={"options": [{"label": "B"}]},
        )
        assert result.status_code == 200 and result.json()["logic_rules"] == []
    else:
        question = source if deletion == "source" else target
        assert (
            client.delete(
                f"/api/forms/{form['id']}/questions/{question['id']}"
            ).status_code
            == 204
        )
        assert all(
            not q["logic_rules"]
            for q in client.get(f"/api/forms/{form['id']}").json()["questions"]
        )
    with db_factory() as db:
        assert db.scalar(select(func.count(LogicRule.id))) == 0


def test_unchanged_options_preserve_rules_and_ids_on_editor_saves(client):
    form = create_form(client)
    source = add_question(
        client, form["id"], "multiple_choice", options=[{"label": "A"}, {"label": "B"}]
    )
    rules = [
        {"condition_option_id": option["id"], "target_question_id": None}
        for option in source["options"]
    ]
    save(client, form, source, rules)
    path = f"/api/forms/{form['id']}/questions/{source['id']}"
    updated = client.patch(
        path, json={"title": "New title", "options": [{"label": "A"}, {"label": "B"}]}
    ).json()
    assert len(updated["logic_rules"]) == 2 and updated["options"] == source["options"]
    updated = client.patch(path, json={"options": [{"label": "A"}]}).json()
    assert len(updated["logic_rules"]) == 1
    assert (
        updated["logic_rules"][0]["condition_option_id"] == source["options"][0]["id"]
    )


def test_source_type_change_removes_rules(client):
    form, questions = branch_form(client)
    save(client, form, questions[0], [boolean_rule(True)])
    result = client.patch(
        f"/api/forms/{form['id']}/questions/{questions[0]['id']}",
        json={"type": "rating"},
    )
    assert result.status_code == 200 and result.json()["logic_rules"] == []


def test_duplication_remaps_every_rule_and_option(client):
    form = create_form(client)
    sources = [
        add_question(client, form["id"], "multiple_choice", options=[{"label": "A"}]),
        add_question(client, form["id"], "dropdown", options=[{"label": "B"}]),
        add_question(client, form["id"], "yes_no"),
        add_question(client, form["id"], "rating"),
        add_question(client, form["id"], "long_text"),
    ]
    rules = [
        {
            "condition_option_id": sources[0]["options"][0]["id"],
            "target_question_id": sources[1]["id"],
        },
        {
            "condition_option_id": sources[1]["options"][0]["id"],
            "target_question_id": sources[4]["id"],
        },
        boolean_rule(True, sources[3]["id"]),
        {"condition_rating_value": 1, "target_question_id": None},
    ]
    for source, rule in zip(sources, rules):
        assert save(client, form, source, [rule]).status_code == 200
    form = publish(client, form["id"])
    duplicate = client.post(f"/api/forms/{form['id']}/duplicate").json()
    copies = duplicate["questions"]
    original_ids = {q["id"] for q in sources}
    for index, source in enumerate(copies[:4]):
        rule = source["logic_rules"][0]
        assert source["id"] not in original_ids
        assert rule["target_question_id"] not in original_ids
        if index < 2:
            assert rule["condition_option_id"] == source["options"][0]["id"]
            assert rule["condition_option_id"] != sources[index]["options"][0]["id"]
    assert copies[0]["logic_rules"][0]["target_question_id"] == copies[1]["id"]
    assert copies[1]["logic_rules"][0]["target_question_id"] == copies[4]["id"]
    assert duplicate["response_count"] == 0 and duplicate["public_slug"] is None
    duplicate = publish(client, duplicate["id"])
    assert (
        submit(
            client,
            duplicate["public_slug"],
            [
                {
                    "question_id": copies[0]["id"],
                    "value": copies[0]["options"][0]["id"],
                },
                {
                    "question_id": copies[1]["id"],
                    "value": copies[1]["options"][0]["id"],
                },
                {"question_id": copies[4]["id"], "value": "Copy path"},
            ],
        ).status_code
        == 201
    )


@pytest.mark.parametrize("has_response", [False, True])
def test_logic_editability_matches_question_history_policy(client, has_response):
    form, questions = branch_form(client)
    save(client, form, questions[0], [boolean_rule(False)])
    form = publish(client, form["id"])
    assert save(client, form, questions[0], []).status_code == 409
    if has_response:
        assert (
            submit(
                client,
                form["public_slug"],
                [{"question_id": questions[0]["id"], "value": False}],
            ).status_code
            == 201
        )
    client.post(f"/api/forms/{form['id']}/unpublish")
    assert save(client, form, questions[0], []).status_code == (
        409 if has_response else 200
    )


def test_reorder_rejects_backward_rules_without_changing_definition(client):
    form, questions = branch_form(client)
    save(client, form, questions[0], [boolean_rule(True, questions[2]["id"])])
    ids = [q["id"] for q in questions]
    path = f"/api/forms/{form['id']}/questions/reorder"
    assert client.put(path, json={"question_ids": ids[::-1]}).status_code == 422
    assert [
        q["id"] for q in client.get(f"/api/forms/{form['id']}").json()["questions"]
    ] == ids
    assert (
        client.put(
            path, json={"question_ids": [ids[0], ids[2], ids[1], ids[3]]}
        ).status_code
        == 200
    )


def test_publish_revalidates_persisted_targets(client, db_factory):
    form, questions = branch_form(client)
    with db_factory.begin() as db:
        db.add(
            LogicRule(
                source_question_id=questions[0]["id"],
                condition_boolean_value=True,
                target_question_id=questions[0]["id"],
            )
        )
    assert client.post(f"/api/forms/{form['id']}/publish").status_code == 422


def test_publish_rejects_malformed_persisted_rating_condition(client, db_factory):
    form, questions = branch_form(client)
    with db_factory.begin() as db:
        db.add(
            LogicRule(source_question_id=questions[2]["id"], condition_rating_value=1.5)
        )
    assert client.post(f"/api/forms/{form['id']}/publish").status_code == 422


@pytest.mark.parametrize(
    "fields",
    [
        {},
        {"condition_boolean_value": True, "condition_rating_value": 1},
        {"condition_rating_value": 6},
    ],
)
def test_database_logic_condition_constraints(client, db_factory, fields):
    form, questions = branch_form(client)
    with pytest.raises(IntegrityError), db_factory.begin() as db:
        db.add(LogicRule(source_question_id=questions[0]["id"], **fields))
        db.flush()
