from concurrent.futures import ThreadPoolExecutor

import pytest
from alembic.config import Config
from sqlalchemy import func, inspect, select, text
from sqlalchemy.exc import IntegrityError

from alembic import command
from app.core.config import BACKEND_DIR
from app.db.seed import seed
from app.models import Answer, Form, Question, QuestionOption, Response
from tests.helpers import add_question, create_form


def test_seed_is_idempotent_and_answers_valid(client, db_factory):
    with db_factory.begin() as db:
        assert seed(db) == 2
    with db_factory.begin() as db:
        assert seed(db) == 0
    with db_factory() as db:
        expected = {Form: 2, Question: 8, QuestionOption: 6, Response: 6, Answer: 24}
        for model, count in expected.items():
            assert db.scalar(select(func.count()).select_from(model)) == count
        assert db.execute(text("PRAGMA foreign_key_check")).all() == []
    forms = client.get("/api/forms").json()
    assert all(f["status"] == "published" and f["response_count"] == 3 for f in forms)
    assert client.get("/api/public/forms/sample-product-feedback").status_code == 200
    assert client.get("/api/public/forms/sample-event-survey").status_code == 200


def test_database_enforces_foreign_keys_unique_order_and_answer_shape(
    client, db_factory
):
    form = create_form(client)
    question = add_question(client, form["id"])
    invalid_sql = [
        "INSERT INTO responses (form_id) VALUES (999999)",
        "INSERT INTO questions (form_id, type, title, required, position, updated_at) "
        f"VALUES ({form['id']}, 'short_text', 'Duplicate position', 0, 0, CURRENT_TIMESTAMP)",
        "INSERT INTO questions (form_id, type, title, required, position, updated_at) "
        f"VALUES ({form['id']}, 'unsupported', 'Invalid type', 0, 1, CURRENT_TIMESTAMP)",
        "INSERT INTO forms (title, status, updated_at) VALUES ('X', 'published', CURRENT_TIMESTAMP)",
    ]
    for statement in invalid_sql:
        with pytest.raises(IntegrityError), db_factory.begin() as db:
            db.execute(text(statement))
    with db_factory.begin() as db:
        response = Response(form_id=form["id"])
        db.add(response)
        db.flush()
        response_id = response.id
    with pytest.raises(IntegrityError), db_factory.begin() as db:
        db.add(
            Answer(
                response_id=response_id,
                question_id=question["id"],
                text_value="X",
                number_value=1,
            )
        )
        db.flush()


def test_database_cascade_without_orm(client, db_factory):
    with db_factory.begin() as db:
        seed(db)
        db.execute(text("DELETE FROM forms"))
    with db_factory() as db:
        for table in ("forms", "questions", "question_options", "responses", "answers"):
            assert db.execute(text(f"SELECT count(*) FROM {table}")).scalar_one() == 0


def test_concurrent_question_appends_preserve_positions(client):
    form = create_form(client)

    def append(index):
        return client.post(
            f"/api/forms/{form['id']}/questions",
            json={"type": "short_text", "title": f"Question {index}"},
        )

    with ThreadPoolExecutor(max_workers=4) as executor:
        results = list(executor.map(append, range(4)))
    assert [result.status_code for result in results] == [201] * 4
    detail = client.get(f"/api/forms/{form['id']}").json()
    assert [q["position"] for q in detail["questions"]] == [0, 1, 2, 3]


def test_migration_downgrade_upgrade_round_trip(db_factory):
    config = Config(str(BACKEND_DIR / "alembic.ini"))
    engine = db_factory.kw["bind"]
    with engine.connect() as connection:
        config.attributes["connection"] = connection
        command.downgrade(config, "base")
        assert set(inspect(connection).get_table_names()) == {"alembic_version"}
        command.upgrade(config, "head")
        assert set(inspect(connection).get_table_names()) == {
            "alembic_version",
            "forms",
            "questions",
            "question_options",
            "responses",
            "answers",
        }
