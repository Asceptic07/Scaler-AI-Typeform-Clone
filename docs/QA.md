# Requirement and QA audit

Audit date: 2026-10-07. Specification: **Assignment Typeform Clone.pdf**, all four
pages. Checks use the existing repository, Chrome, the running FastAPI API, and
real SQLite persistence. Browser tests use isolated scratch forms, removed after
verification; existing sample forms and responses are preserved.

## Latest verification and submission readiness

The latest completed end-to-end QA recorded below passed backend Ruff, all
**55 backend tests**, Alembic check, frontend lint, the frontend production build,
and manual end-to-end browser QA. These are prior QA results; backend and browser
checks are not rerun for the documentation/empty-preview cleanup. Frontend lint
and the production build passed again for this cleanup.

The final read-only source audit verified the public repository at
[Asceptic07/Scaler-AI-Typeform-Clone](https://github.com/Asceptic07/Scaler-AI-Typeform-Clone)
and a clean working tree at commit `30f429c`. It did not rerun runtime checks or
certify exact Typeform visual fidelity. **Hosted demo: pending deployment.**

## Mandatory application requirements

| Requirement | Result | Verification |
| --- | --- | --- |
| Next.js/TypeScript frontend | PASS | Lint, production build, and Chrome |
| Python FastAPI backend | PASS | Imports, health, real API calls, 55 tests |
| Relational SQLite persistence | PASS | Integrity/FK checks, migrations, constraints/cascade tests |
| Create a form and title | PASS | Workspace create dialog and persisted form |
| Add questions | PASS | Eight types created through builder |
| Edit questions | PASS | Title, description, choices, and type persisted |
| Delete questions | PASS | Extra question deleted through confirmation |
| Pointer drag-and-drop reorder | PASS | Dragged question, API order check, browser reload |
| Keyboard reorder | PASS | Space/ArrowDown/Space and persisted order |
| Short text | PASS | Builder, preview, public entry, persisted result |
| Long text | PASS | Newlines retained through public submission and detail |
| Multiple choice | PASS | Single selection, keyboard shortcut, option label in results |
| Dropdown | PASS | Native keyboard selection and option label in results |
| Email | PASS | Client invalid-email check and actual server rejection |
| Number | PASS | Invalid number rejected; zero submitted and displayed |
| Yes/no | PASS | False persisted and rendered as No |
| Rating | PASS | Keyboard selection; 4 / 5 detail; distribution/average |
| Required settings | PASS | Toggle persisted; public blank validation |
| Description/help text | PASS | Edited in builder, saved for all eight questions |
| Live preview | PASS | Working definition, question navigation, mobile preview |
| List forms | PASS | Seeded and new forms in dashboard |
| Draft/published status | PASS | Create/publish/unpublish UI and API |
| Response counts | PASS | New public submission updates count from 0 to 1 |
| Rename | PASS | Builder/workspace dialog and persisted title |
| Duplicate | PASS | Draft copy has questions, no responses, no public slug |
| Delete forms | PASS | Confirmation and cascade checks; scratch forms removed |
| Publish | PASS | Existing APIs and share dialog |
| Unpublish | PASS | Public URL unavailable afterward |
| Stable shareable URL | PASS | Real clipboard URL, public route, republish retains slug |
| Persist form definitions | PASS | API checks and reload after editing/reordering |
| No respondent authentication | PASS | Public browser flow without creator shell or login |
| One question at a time | PASS | Single active screen across all eight question types |
| Full-screen respondent presentation | PASS | Desktop/mobile visual inspection |
| Smooth transitions | PASS | Restrained motion; reduced-motion emulation |
| Progress indicator | PASS | Question index and progress values during public navigation |
| Enter/arrow navigation | PASS | Forward/backward navigation; native select/multiline exceptions |
| Client required validation | PASS | Required blank answer remains on question with error |
| Client email validation | PASS | Invalid email remains on question |
| Client number validation | PASS | Invalid number remains on question |
| Server validation | PASS | Real 422, no partial response, focus restored |
| Persist submission | PASS | All eight values read back from the API after keyboard submission |
| Thank-you screen | PASS | Shown after confirmed persistence; heading receives focus |
| Per-form response list | PASS | Newest-first seeded/new submission lists |
| Individual response | PASS | Dedicated response route and back navigation |
| Full submitted answers | PASS | Every type verified; optional omission shown as Not answered |
| Basic per-question statistics | PASS | Answered counts and choice/dropdown/boolean/rating distributions |
| Persistent response results | PASS | SQLite/API data remains available across page reload/navigation |
| Typeform-like workspace | PASS | Cards, understated navigation, menus, search, grid/list |
| Typeform-like builder | PASS | Rail/canvas/settings hierarchy compared with public references |
| Typeform-like public experience | PASS | Conversational layout, underline inputs, choices, progress, motion |
| Modals | PASS | Native dialogs, focus containment, Escape, focus return |
| Inline editing | PASS | Question/title/help-text/options save through API |
| Notifications/toasts | PASS | Management, share, mutation failure, save feedback |
| Theme settings placeholder | PASS | Builder Settings dialog: Theme: Coming soon; non-interactive, no settings API or persistence |
| Thank-you screen settings placeholder | PASS | Builder Settings dialog: Thank-you screen: Coming soon; non-interactive, no settings API or persistence |
| At least two seeded published forms | PASS | Fresh database produces two published samples |
| Existing mixed seeded responses | PASS | Six responses covering all eight question types |
| README/setup/stack/architecture/schema/API | PASS | Root README and verified commands |
| Original implementation/resources | PASS | Original code/vector UI; dependency/font notices checked |

## Submission deliverables

| Deliverable | Result | Remaining action |
| --- | --- | --- |
| Local source with frontend/ and backend/ | PASS | Source is committed; working tree was clean at the latest read-only verification |
| Documentation | PASS | README and this audit |
| Public GitHub repository URL | PASS | Public repository verified: https://github.com/Asceptic07/Scaler-AI-Typeform-Clone |
| Hosted working demo URL | PENDING | Pending deployment; configure durable SQLite hosting and verify the hosted application |
| Submit both URLs by communicated deadline | PENDING | Repository URL exists; requires the hosted demo URL and external submission step |

These are external submission prerequisites, not completed deployments. The local
application and preparation are verified; this audit does **not** claim the entire
submission is finished. The assignment's interview/code-understanding requirement
also requires the candidate's preparation and cannot be certified by automated QA.

## Browser and accessibility coverage

- All five route areas checked at 320, 390, 768, 1024, and 1440 CSS pixels.
  No unintended horizontal page overflow. The mobile question rail intentionally
  scrolls horizontally. Question settings remain reachable below the canvas.
- Mobile search, no-match search, grid/list, overflow menus, title/confirmation/
  and share dialogs, previews, and creator navigation tested.
- Pointer and keyboard ordering, native choice controls, Tab/Shift+Tab, Enter,
  arrows, choice shortcuts, keyboard menus/tabs, focus trapping/return, and
  reduced motion reviewed. Public submission completed primarily by keyboard.
- A separate all-eight-type public form was completed using keyboard input only
  after opening its URL, including Tab/Shift+Tab, native dropdown arrows,
  back/forward question arrows, choice shortcuts, multiline input, zero, and No.
  All eight persisted values matched the inputs.
- Rendered text contrast checked against solid backgrounds; five muted colors
  darkened. Disabled controls and decorative marks are excluded. This is a scoped
  check, not a claim of a certified WCAG or screen-reader audit.
- Loading, empty workspace, empty builder, no responses, zero-answer distributions,
  invalid form/slug/response, backend unavailable, failed mutation/reorder/save,
  server rejection, and retries exercised. A valid published empty form is blocked
  by the API; the defensive public empty-definition state remains present.
- Real malformed-email submission reached the server, returned 422, retained
  earlier answers, and focused the invalid question. Retry subsequently persisted
  one complete response. Unpublishing during filling and blocked submission also
  retain answers. Normal successful workflows have no unresolved console errors;
  expected deliberately induced failed requests are distinguished from defects.
- Statistics compared with the API: product Basic 1/3 (33.3%), Pro 2/3 (66.7%),
  Business 0; rating average 4/5. Event dropdown 1/3 per option, yes 2/3 and no 1/3.
  Zero-answer distributions safely display 0%, with no NaN or invented average.

## Database and backend review

`PRAGMA integrity_check` returns `ok`; `PRAGMA foreign_key_check` returns no rows.
Schema contains forms, questions, question_options, responses, answers, and Alembic
version tracking. Foreign keys use cascade deletion; position/value constraints,
timestamps, and response indexes match the SQLAlchemy metadata. `alembic check`
reports no pending schema changes. A fresh temporary database migrated and seeded
twice has exactly two published forms, eight questions/types, six responses, and
24 answers. No developer database reset or schema change was needed.

Models, schemas, route handlers, services, and transaction dependencies were
reviewed. Foreign-key enforcement, atomic validation/submission, and protected
published/history state are covered by existing tests. No backend redesign or
test weakening was performed.

## Checks, licenses, and repository hygiene

- Backend: `uv sync`, Ruff, **55 pytest tests**, Alembic upgrade/current/check,
  and seed commands pass. Head: `e42a53e64a4a`.
- Frontend: `npm install`, ESLint, and production build pass.
- `npm run start` production server: all five route areas rendered successfully
  in Chrome and returned HTTP 200; original icon and Geist license notice served.
  Production console/runtime errors: none.
- A deliberately stalled dashboard request hit the 10-second timeout despite its
  supplied cancellation signal, and Retry recovered. Hosted settings were checked
  with a configured HTTPS frontend origin: CORS allowed that origin and rejected
  another; health used the configured application name.
- `npm audit --omit=dev`: **0 vulnerabilities**. Full audit reports **5 high
  development-only advisories** in braces/micromatch/fast-glob and the Next ESLint
  configuration/plugin chain. Dependency versions are preserved; no force fix.
- Existing Starlette TestClient/httpx deprecation warning remains.
- No unsafe TypeScript `any`, ts-ignore, or ts-expect-error usage found in app code.
  `AbortSignal.any` is the browser API, not unsafe TypeScript typing. No accidental
  TODO/FIXME/debug/console logging found.
- Tracked source scanned for credential markers; matches are harmless Alembic
  tokens, generated public slugs, SQLAlchemy URL formatting, and dependency names.
  No actual credentials found. Real env files/caches/database/node_modules/.next/
  .venv remain ignored. Largest tracked files are legitimate lockfiles, under 250 KB.
- Major licenses checked from installed metadata and official sources; Geist
  notice retained publicly. Native Next.js sharp/libvips LGPL and browser-support
  data CC-BY notices are documented, rather than blanket MIT claims. No paid or
  proprietary application assets are used. Unused Next/Vercel starter assets removed.
- Deployment instructions cover HTTPS, build-time frontend environment, exact
  CORS origin, runtime migration with a mounted persistent SQLite volume, one
  backend instance, and backups. Hosted restart/redeploy durability is unverified
  until an actual provider is configured.

Physical devices, assistive screen readers, multi-user authentication, pagination,
and production-scale workloads are outside this verified scope. Optional bonus
features were not added.
