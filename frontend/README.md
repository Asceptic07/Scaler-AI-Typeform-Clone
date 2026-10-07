# Scaler Typeform Clone frontend

The frontend for the Scaler Typeform Clone uses Next.js, TypeScript, and the
App Router under `src/app/`.

## Local setup

Run from `frontend/`:

```sh
npm install
npm run dev
```

Open http://localhost:3000. Run the backend using the root setup instructions.

## Environment

`NEXT_PUBLIC_API_URL` specifies the backend base URL, defaulting to
`http://localhost:8000`. Copy `.env.example` to `.env.local` for overrides.
Set this variable before building for production; changes require a rebuild.

## Production checks

```sh
npm run lint
npm run build
```

## Main routes

| Route | Purpose |
| --- | --- |
| `/` | Creator workspace |
| `/forms/[formId]` | Form builder |
| `/forms/[formId]/results` | Responses and statistics |
| `/forms/[formId]/results/[responseId]` | Individual response |
| `/to/[slug]` | Public respondent flow |

See [the full project README](../README.md) for backend setup, architecture,
database schema, APIs, seed data, assumptions, licenses, and deployment notes.
