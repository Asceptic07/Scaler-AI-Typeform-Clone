# Typeform Clone — application foundation

Phase 3 connects the existing Next.js frontend and FastAPI backend. Application
features and database models will be added in later phases.

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

SQLAlchemy provides a declarative Base and request-scoped sessions. Startup and
health checks do not connect to SQLite or create tables. Relative SQLite paths
resolve from `backend/` for both the API and Alembic. Import future model modules
in `app/models/__init__.py` so Alembic discovers them. Migrations are currently
empty; `uv run alembic current` opens SQLite and may create an empty local file.

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
uv run alembic current
```
