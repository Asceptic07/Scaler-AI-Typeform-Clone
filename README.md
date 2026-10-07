# Typeform Clone — current development setup

Phase 4 provides the relational database and backend API. The frontend still
contains only the temporary connectivity page; the final UI comes later.

Run these commands in separate terminals from the repository root.

Frontend:

```sh
cd frontend
npm install
npm run dev
```

Backend (uses the existing `backend/.venv`):

```sh
cd backend
uv sync
uv run alembic upgrade head
uv run python -m app.db.seed
uv run uvicorn app.main:app --reload
```

- Frontend: http://localhost:3000
- Backend health: http://localhost:8000/health
- FastAPI docs: http://localhost:8000/docs

Local defaults work without environment files. For overrides, copy
`backend/.env.example` to `backend/.env` and `frontend/.env.example` to
`frontend/.env.local`. Restart the relevant server after changes. Public frontend
variables are bundled at build time, so production changes require rebuilding.

The temporary page fetches backend health on the server for every request and
shows Connected or Unavailable. Refresh after starting or stopping the backend.
CORS allows the configured `FRONTEND_ORIGIN` for future browser requests.

The backend uses thin `app/routes/` handlers, Pydantic v2 `app/schemas/`, business
logic in `app/services/`, and typed SQLAlchemy models in `app/models/`.
`app/db/session.py` provides request-scoped sessions and enables SQLite foreign
keys on every connection. SQLite writers begin with `BEGIN IMMEDIATE` before
reading state, so question edits, publishing, and submission validation cannot
race with another writer. Each mutation commits once or rolls back completely.
Startup and health checks do not create tables. All schema changes use Alembic.
Relative database paths resolve from `backend/` for both the API and migrations.

The database has these relational tables:

| Table | Purpose and constraints |
| --- | --- |
| `forms` | Required title, draft/published status, unique nullable public slug, UTC timestamps. Published forms must have a slug. |
| `questions` | Form FK, constrained type, title, help text, required flag, timestamps. Unique `(form_id, position)` and nonnegative position. |
| `question_options` | Question FK, label, timestamp, unique `(question_id, position)`. |
| `responses` | Form FK and UTC submission timestamp; indexed for newest-first retrieval. |
| `answers` | Response/question FKs, optional option FK, timestamp. Unique `(response_id, question_id)`; exactly one text, number, boolean, or option value. |

Form deletion cascades through questions, options, responses, and answers.
Question deletion cascades through its options and dependent answers.
Application validation additionally ensures answers refer to this form's
questions and each selected option belongs to the exact question.
Response counts are derived from persisted responses, never manually incremented.

Question creation, editing, deletion, and reordering return **409** while a form
is published or has any submissions. Unpublishing unlocks forms without
submissions. Forms with submissions must be duplicated to revise their question
definition. This preserves question text, types, and option labels in results.
Form renaming, unpublishing, and explicit whole-form deletion remain available.
Duplication creates a fresh draft with new question/option IDs and no submissions
or slug. Unpublishing retains the slug; republishing keeps the same public URL.

Supported types: `short_text`, `long_text`, `multiple_choice`, `dropdown`, `email`,
`number`, `yes_no`, and `rating`. Both choice types accept **one option ID** per
answer. Rating is an integer from **1 to 5**. Numbers must be finite JSON numbers;
integer inputs are limited to the exact double-precision range ±2^53. Booleans
and numeric strings are rejected for numeric questions. Email validation checks
format without DNS lookups. Optional missing/null/blank answers are omitted;
required missing/null/blank answers are rejected. Invalid submissions leave no
partial response. Short text is limited to 1,000 characters, long text to 20,000.

Migration and seed commands (from `backend/`):

```sh
uv run alembic upgrade head
uv run alembic current
uv run alembic check
uv run python -m app.db.seed
```

The seed creates `sample-product-feedback` and `sample-event-survey`, each with
four required questions and three valid responses. Together they cover all eight
question types. Existing samples are identified by their stable slugs and skipped
without overwriting user edits or responses. The database and caches stay ignored
by Git. Migration `e42a53e64a4a` creates the initial schema.

API routes (full request/response schemas at `/docs`):

| Method | Route | Behavior |
| --- | --- | --- |
| GET | `/health` | Service health, independent of the database |
| POST / GET | `/api/forms` | Create draft / list with response counts |
| GET / PATCH / DELETE | `/api/forms/{form_id}` | Full definition / rename / cascade delete |
| POST | `/api/forms/{form_id}/duplicate` | Copy definition into a draft |
| POST | `/api/forms/{form_id}/publish` | Validate and publish with a random slug |
| POST | `/api/forms/{form_id}/unpublish` | Block public access, retain slug |
| POST | `/api/forms/{form_id}/questions` | Append question |
| PATCH / DELETE | `/api/forms/{form_id}/questions/{question_id}` | Update / delete question |
| PUT | `/api/forms/{form_id}/questions/reorder` | Set complete order |
| GET | `/api/public/forms/{public_slug}` | Published definition without results metadata |
| POST | `/api/public/forms/{public_slug}/responses` | Validate and submit answers atomically |
| GET | `/api/forms/{form_id}/responses` | Responses newest first with answer summaries |
| GET | `/api/forms/{form_id}/responses/{response_id}` | Values, question text/type, option labels |
| GET | `/api/forms/{form_id}/statistics` | Total count, answered counts, choice/boolean/rating distributions |

Create/rename uses `{"title": "Customer feedback"}`. Question payloads use
`{"type": "dropdown", "title": "Choose a plan", "required": true, "options": [{"label": "Basic"}, {"label": "Pro"}]}`.
Reordering uses `{"question_ids": [3, 1, 2]}` and requires every question ID exactly
once. Submission uses `{"answers": [{"question_id": 1, "value": "Alex"}, {"question_id": 2, "value": 7}]}`;
for choice questions the value is the option ID returned by the form endpoint.
Creation returns **201**, deletion **204**, missing resources **404**, invalid
payloads/answers **422**, and publishing an empty form **400**.

The assignment assumes one default creator, so management endpoints have no
authentication. Response listing currently returns all submissions without
pagination. SQLite serializes writers; this is intended for the assignment's
local database workload. Timestamps are stored in UTC.

Validation:

```sh
cd frontend
npm run lint
npm run build
```

```sh
cd backend
uv run ruff check .
uv run pytest
uv run alembic upgrade head
uv run alembic current
```

Tests migrate a fresh temporary SQLite database for each test and never use the
developer database. Coverage includes the API workflows, invalid submissions,
history protection, database constraints/cascades, seed idempotence, concurrent
question creation, and migration downgrade/upgrade. The installed Starlette
TestClient adapter reports a harmless `httpx` deprecation warning; no dependency
changes are required for this phase.
