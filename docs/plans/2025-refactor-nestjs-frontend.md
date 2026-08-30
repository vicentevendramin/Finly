# Refactor: Meu Termômetro Financeiro → NestJS + TypeORM backend, finalized React frontend

## Context

The app today is an academic MVP: a plain Express + raw-SQL backend and a React frontend built with prop-drilled state (`App.tsx` owns everything, including a `keyForRefresh` counter used as a `key` prop to force remounts instead of real cache invalidation). Two of the four main sections — Goals and Reports — are still literal placeholders ("em construção"); `GoalsList.tsx` renders hardcoded fake data and isn't even wired into `GoalsPage.tsx`. There's no i18n, no dark mode, no real responsive strategy, and `backend/.env` (with real DB password and JWT secret) is committed to git.

The user is graduating this from an academic project into an app they'll actually self-host and use day-to-day on their home Proxmox server. This plan migrates the backend to NestJS + TypeORM for maintainability, adds real observability (Prometheus/Grafana + an in-app admin panel) since they'll be the one operating it, finishes Goals and Reports as real features, and gives the frontend a proper architecture (routing, query caching, i18n, a documented blue-based design system) and genuine responsive layout for desktop and mobile. Everything ships as a single Docker Compose stack for self-hosting.

## Locked decisions (from user, do not re-litigate)

1. **Observability**: Prometheus + Grafana metrics, plus an in-app admin panel. (Structured error logging + a `/health` endpoint are included as the minimal foundation these two need — not full OpenTelemetry tracing, which was not requested.)
2. **Goals**: hybrid model — manual contributions **and** optional linkage to a transaction category, both counting toward progress.
3. **Reports**: balance-over-period, category breakdown, month-over-month comparison, and CSV/PDF export.
4. **Frontend state**: TanStack Query for server data, Zustand for UI state.
5. **Deployment**: everything (frontend + backend + db + observability) self-hosted via Docker Compose on the user's Proxmox — not GitHub Pages.
6. **Data**: fresh start — no need to preserve/migrate current DB rows.
7. **Testing**: basic coverage — unit tests for main services/controllers, e2e for critical flows (login, transaction CRUD). Not exhaustive.
8. **Design**: blue as primary color + one complementary accent, genuinely responsive (desktop of varying sizes + mobile), documented style guide as a deliverable.
9. **i18n**: i18next / react-i18next, pt-BR (default, matches current copy) + en-US.
10. **Rebrand**: the app is renamed from "Meu Termômetro Financeiro" to **Finly** (English name) as part of this refactor.

## Backend — NestJS module layout

```
backend/src/
  main.ts                        # ValidationPipe, CORS, global HttpExceptionFilter
  app.module.ts
  config/                        # ConfigModule + env validation
  database/                      # TypeOrmModule.forRootAsync, migrations/
  common/
    filters/http-exception.filter.ts   # keeps current {error: string} response shape
    interceptors/logging.interceptor.ts
    guards/roles.guard.ts
  auth/                          # AuthModule: JwtStrategy + JwtAuthGuard (Passport)
  users/                         # User entity lives here (shared by Auth/Admin/Goals)
  transactions/
  goals/
  reports/
  admin/
  observability/                 # /metrics (Prometheus), /health
```

**Why Passport-based JWT over hand-rolled guard**: idiomatic Nest pattern, composes cleanly with the new `RolesGuard` needed for the admin panel, no benefit to reinventing header parsing.

**Why keep the `{error: string}` response shape**: `frontend/src/services/apiService.ts:35` already parses `errorBody.error`. A global `HttpExceptionFilter` reformats Nest's default error shape to match, so the frontend HTTP layer needs zero changes during backend migration — reduces blast radius.

### Entities

- **User**: `id, email, passwordHash, role: 'user'|'admin' (default 'user', NEW), createdAt`. No `name` field (frontend already treats it as unused-optional).
- **Transaction**: 1:1 with current schema — `id, user (FK), description, amount, date, type, category, createdAt`, same indexes (`user_id`, `(user_id, date)`).
- **Goal**: `id, user (FK), name, targetAmount, category: string | null (optional link — matching transactions of type='income' in this category count as progress), deadline: date | null (small nice-to-have), createdAt`.
- **GoalContribution**: `id, goal (FK, cascade), amount, date, note: string | null, createdAt`.
  - Progress = `SUM(contributions) + SUM(income transactions matching goal.category)`, computed on read in `GoalsService`, not stored redundantly.
- **ErrorLog** (for the admin panel): `id, message, stack, path, userId: nullable, createdAt` — written by the global exception filter on 5xx errors. This is the only "structured logging" being added; no Winston/Pino/OpenTelemetry.

### Validation & migrations

- Replace manual `if` checks in the current controllers with `class-validator` DTOs + a global `ValidationPipe({ whitelist: true, transform: true })`. Keep the existing Portuguese error messages via custom decorator messages.
- TypeORM migrations (`synchronize: false`), run at container startup before `node dist/main.js`. Since no data needs preserving, the first migration creates the full schema (users incl. `role`, transactions, goals, goal_contributions, error_logs) from scratch — no legacy-compat migration needed.

### Observability & Admin

- `ObservabilityModule`: `/metrics` via `@willsoto/nestjs-prometheus` (HTTP request counter/histogram by route+status, gauges for user/transaction counts), `/health` (checks `DataSource.isInitialized`) for the Docker healthcheck.
- `AdminModule`, guarded by `JwtAuthGuard` + `RolesGuard('admin')`: `GET /admin/stats` (user/transaction counts, period filters), `GET /admin/errors` (recent `ErrorLog` rows).
- No admin bootstrap flow exists yet — first admin is promoted manually (one-off SQL or a small seed script), not built as an invite/self-service feature.

### Backend task order

| # | Status | Task | Notes |
|---|---|---|---|
| B1 | ✅ done | Scaffold NestJS: ConfigModule, global `ValidationPipe`, CORS (matching `server.js:13-17`), global `HttpExceptionFilter` | Nest 12 (ESM/Vitest/oxlint — current CLI defaults) |
| B2 | ✅ done | `DatabaseModule` + TypeORM (`forRootAsync` from same env vars as today: `DB_HOST/PORT/NAME/USER/PASSWORD`) | |
| B3 | ✅ done | `UsersModule` + `AuthModule`: `User` entity (with `role` from day one), `JwtStrategy`/`JwtAuthGuard`, register/login/me at functional parity with `authController.js` | bcrypt cost 12 kept |
| B4 | ✅ done | `TransactionsModule`: entity, DTOs, CRUD at parity with `transactionsController.js` (month filter, ownership checks, same JSON shape — `amount` as float, `date` as `YYYY-MM-DD`) | |
| B5 | ✅ done | Unit + e2e tests for Auth + Transactions | parity checkpoint before cutting over the frontend — verified with curl + full suite against a real Postgres |
| B6 | ✅ done | `GoalsModule`: `Goal` + `GoalContribution` entities, CRUD, contribution endpoint, aggregated progress read | depends on B3 — verified with unit + e2e tests incl. the hybrid manual+category-linked progress calc |
| B7 | ✅ done | `ReportsModule`: balance-by-period, category breakdown, month-over-month, CSV export (hand-rolled — `json2csv` alpha had no usable types) + PDF export (`pdfkit`) | pure queries over `Transaction`, no new entity — verified with unit + e2e tests |
| B8 | ✅ done | `role` rollout + `RolesGuard` + `AdminModule` (stats, error log endpoint) + `ErrorLog` entity wired into the exception filter | filter is now DI-managed (`APP_FILTER` in `CommonModule`) instead of manually `new`'d in `main.ts`, so it can inject the `ErrorLog` repository |
| B9 | ✅ done | `ObservabilityModule` (`/metrics`, `/health`, metrics interceptor) | used `@prometheus-io/client` directly (the official successor to the now-deprecated `prom-client`) instead of `@willsoto/nestjs-prometheus`, which still doesn't support Nest 12 peer deps |
| B10 | ✅ done | Unit + e2e tests for Goals/Reports/Admin | closes agreed test scope — 36 unit + 25 e2e passing, plus a fix for e2e file-parallelism racing on migrationsRun |

## Rename to Finly ✅ done

Independent of everything else, no dependencies — do it early so all new code/docs/containers are written under the final name instead of being renamed twice. Touches:

- `frontend/package.json`: `name`, and drop the GitHub-Pages-specific `homepage` field (no longer relevant once self-hosted via Docker).
- `frontend/vite.config.ts`: `base: '/Meu-Termometro-Financeiro/'` → `base: '/'` (the base path only existed for the GitHub Pages project subpath; self-hosting via nginx from the domain root doesn't need it — this also simplifies routing once React Router is added in F1).
- `frontend/index.html` `<title>`, `backend/package.json` `name`, root `README.md` / `backend/README.md` titles and references.
- Docker service/container names in the new root compose (`finance_db`/`finance_backend` → `finly_db`/`finly_backend`, etc. — do this directly in the new compose from **I1**, no need to rename the old one first).
- Any app-name string surfaced in the UI (e.g. the loading text in `App.tsx:127`, currently "Carregando Termômetro Financeiro...") should go through i18next (**F3**) under the new name in both locales.
- Not in scope for Claude to execute: renaming the actual GitHub repository / remote — flag it to the user as a manual step if they want the repo slug to match.

## Infra — Docker Compose

Root-level `docker-compose.yml` (replacing `backend/docker-compose.yml`) with services: `db` (postgres:16-alpine, env-driven not hardcoded, healthcheck), `backend` (multi-stage Dockerfile: TS build → slim runtime, runs migrations then starts, `depends_on: db: condition: service_healthy`), `frontend` (multi-stage: `npm run build` → nginx:alpine serving `dist/` with SPA fallback `try_files $uri /index.html`), `prometheus` (scrapes `backend:3001/metrics`), `grafana` (provisioned datasource + a starter dashboard).

**Secret hygiene fix (do this early, no dependencies)**: `backend/.env` is currently tracked in git with real credentials (`backend/.gitignore` only excludes `node_modules`). Add `.env.example` documenting required vars, gitignore the real `.env`, `git rm --cached backend/.env`, and flag to the user that the already-leaked JWT secret/DB password should be rotated in any real deployment.

| # | Status | Task | Depends on |
|---|---|---|---|
| I1 | ✅ done | Root compose: `db` + `backend`, `.env` fix, healthchecks | can run alongside B1-B2 |
| I2 | ✅ done | Backend multi-stage Dockerfile | verified with a full `docker compose up --build` + curl smoke test |
| I3 | ✅ done | Frontend multi-stage Dockerfile + nginx SPA config | nginx also reverse-proxies `/api` to the backend service (same-origin from the browser, sidesteps CORS/hostname coupling entirely — portable to any self-hosted domain/IP without rebuilding). Hit and fixed a real gotcha: the healthcheck's `wget http://localhost/` failed because the container resolves `localhost` to `::1` first and nginx only binds IPv4 — switched to `127.0.0.1`. Verified live: full 5-service `docker compose up` stack, register/login/create-transaction through the Dockerized frontend, reload survives via SPA fallback |
| I4 | ✅ done | Add `prometheus` + `grafana` services + provisioning files | depends on B9 — verified live: Prometheus scrapes `backend:3001/api/metrics`, Grafana auto-provisions the Prometheus datasource + a starter dashboard |
| I5 | ✅ done | Update root/backend README with compose instructions + secret-rotation note | done alongside I1/I2; will need another pass once frontend/observability land |

## Frontend — architecture

- **Routing**: introduce React Router (currently `ActiveView` is just a string in `useState`, not reflected in the URL — no deep-linking, F5 always resets to dashboard). Routes: `/login`, `/register`, `/app/dashboard`, `/app/transactions`, `/app/goals`, `/app/reports`, `/app/admin` (role-gated). `ActiveView` state is retired in favor of the active route.
- **TanStack Query**: `QueryClientProvider` in `main.tsx`; domain hooks (`useTransactions`, `useCreateTransaction`, `useGoals`, `useAddContribution`, `useReports`, `useAdminStats`) wrapping the existing `apiService.ts` (kept as-is as the HTTP layer). Mutations invalidate on success — this is what finally removes the `keyForRefresh` hack in `App.tsx`.
- **Zustand**: one small UI store (`isModalOpen`, `editingTransaction`, modal open/close/edit actions, `theme`) and a small auth store (`user`, token-derived login state) — replacing the state currently living in `App.tsx`.
- **i18next**: `frontend/src/i18n/` with `pt-BR`/`en-US` namespaced locale JSON per page area, `pt-BR` as fallback (matches all current hardcoded copy), `i18next-browser-languagedetector` (localStorage → navigator), switcher in the Sidebar (desktop) / mobile drawer.
- **Design system**: Tailwind v4 is already in use (`@import "tailwindcss"` + `@tailwindcss/vite`), so theme customization belongs in `@theme` inside `index.css`, not `tailwind.config.js` (currently empty `theme.extend`). Proposed palette:
  - Primary blue: `#2563EB`-based scale (close to the `blue-600` already used in the Sidebar/buttons today, so it reads as a refinement, not a rebrand).
  - Complementary accent: warm amber (`#F59E0B`-ish) for secondary CTAs and attention states (near-deadline goals, negative balance) — sits opposite blue on the wheel without clashing with the existing green/red income-expense semantics.
  - Keep green/red (`emerald-500`/`rose-500`) as formal `success`/`danger` tokens instead of ad-hoc Tailwind classes.
  - Add dark mode (`dark:` variant / class strategy) — genuinely new scope, today everything is hardcoded light (`bg-gray-100`/`bg-white`).
  - Document as a style guide: palette, type scale, spacing convention, component tokens (primary/secondary button, card, status badge).
- **Responsive**: Sidebar (currently fixed `w-64`, no breakpoints) becomes a mobile drawer or bottom-nav under `md`, fixed sidebar at `md+`; Dashboard grid gets more breakpoints incl. handling for ultrawide monitors; transaction tables collapse to stacked cards on small screens.

### Frontend task order

| # | Status | Task | Depends on |
|---|---|---|---|
| F1 | ✅ done | Add React Router + TanStack Query + Zustand; refactor `App.tsx`/`AppLayout.tsx` off `activeView`/`page` state for the *existing* pages (Login/Register/Dashboard/Transactions) only | parity checkpoint before extending scope — verified live with a headless-browser walkthrough (register → dashboard → create/edit transaction → reload → logout → re-login), zero console errors |
| F2 | ✅ done | Migrate remaining `apiService` call sites to Query hooks, delete `keyForRefresh` entirely | F1 — done together with F1: Dashboard/Transactions now use `useTransactions`/`useCreateTransaction`/`useUpdateTransaction`/`useDeleteTransaction`, no manual remount-to-refetch anywhere |
| F3 | ✅ done | i18next setup + string extraction for existing pages, language switcher | verified live: full pt-BR ↔ en-US switch via the Sidebar switcher, persists across reload/navigation, zero console errors |
| F4 | ✅ done | Design tokens (`@theme`, blue+amber palette, dark mode) + restyle Sidebar/Layout/Login/Register/Dashboard/Transactions + responsive drawer/bottom-nav | F1 — went with an off-canvas drawer (not a bottom-nav); style guide at `docs/STYLEGUIDE.md` (originally `frontend/STYLEGUIDE.md`); verified live across light/dark/mobile/ultrawide with zero console errors |
| F5 | ✅ done | Goals page: real CRUD, manual contribution UI, category-link picker, combined progress bar | depends on **B6** — category-link picker is a plain text input (matches transactions' own freeform category field, no fixed list exists); Dashboard's `GoalsList` widget also switched from fake data to real. Found and fixed a real bug: backend CORS only allowed GET/POST/PUT/DELETE, blocking the Goals PATCH endpoint entirely |
| F6 | ✅ done | Reports page: 4 sub-features + CSV/PDF export buttons | depends on **B7** — used Recharts, following the dataviz skill's method (income/expense reuse the app's own success/danger tokens as a fixed semantic pair; category breakdown uses the skill's validated CVD-safe categorical palette, capped at 7 + "Other", plus a table view under every chart). Found and fixed a real backend bug: raw `getRawMany()` queries return `date` columns as JS `Date` objects (unlike the repository layer), so CSV export was emitting full `Date.toString()` output instead of `YYYY-MM-DD` |
| F7 | ✅ done | Admin page: stat cards + recent-errors table, route-gated by role | depends on **B8** — required a backend fix first: `/api/auth/register\|login\|me` never returned the user's `role`, so the frontend had no way to know who's an admin. Added it to `AuthService`'s response shape. Verified live: regular user sees no Admin nav link and is redirected away from `/app/admin`; a user promoted via one-off SQL sees it after re-login (fresh JWT) |
| F8 | ✅ done | Frontend tests (Vitest + Testing Library) for critical hooks/components — scope to confirm, not explicitly requested like backend tests were | after F1-F7 — user confirmed basic coverage wanted. 30 tests across `apiService` (fetch wrapper/auth/error handling), `useTransactions`/`useGoals` (cache invalidation, incl. the transaction→goals cross-invalidation), `NewTransactionModal`/`GoalCard` (validation, edit pre-fill, contribution flow), and all three route guards |

## Sequencing

Backend comes first per the user's request, but frontend architecture work (F1-F4) has no real dependency on the *new* backend feature set — only on the auth/transactions endpoints that already exist — so it can run in parallel with backend Goals/Reports/Admin work. Recommended macro order:

1. **B1-B5 + I1-I2 + Rename** in parallel — backend core parity + containerized Postgres/backend + `.env` fix + Finly rebrand (all three prep items have no dependencies, do them immediately).
2. **F1-F2** against the now-parity-tested Nest backend (wait for B5 rather than cutting the frontend over to a backend still being verified).
3. **B6 → B7 → B8 → B9** (Goals, Reports, Role/Admin, Observability — Goals/Reports are independent of each other and can reorder; Observability is the most isolated and could even move last without blocking anything).
4. **F3-F4** as soon as F1-F2 land, independent of backend Fase C.
5. **F5 → F6 → F7**, each starting as soon as its backend module (B6/B7/B8) is ready.
6. **B10 / F8** testing, ideally interleaved per-module rather than saved for the end.
7. **I3-I5** to close: frontend Dockerfile, Prometheus/Grafana compose wiring (needs B9), docs.

## Verification

- Backend: `npm run test` and `npm run test:e2e` green for each module as it lands (B5, B10).
- `docker compose up --build` brings up db + backend + frontend + prometheus + grafana with one command; `curl /api/health` and `/api/metrics` (or configured path) respond.
- Manual walkthrough in the browser: register/login, create/edit/delete a transaction, create a goal with a manual contribution and a category link and confirm progress reflects both, generate each report type and export CSV and PDF, log in as an admin-role user and confirm `/app/admin` shows stats and is inaccessible to a regular user.
- Resize the browser (or device emulation) across mobile/tablet/desktop/ultrawide to confirm the Sidebar and grids adapt as designed; toggle dark mode; switch language pt-BR ↔ en-US and confirm no untranslated strings remain on the pages touched so far.
- `npm run lint` and `npm run build` clean on the frontend.

## Critical files for reference during implementation

- `backend/src/controllers/transactionsController.js`, `backend/src/controllers/authController.js` — functional parity source of truth (including the `{error}` response shape).
- `backend/docker-compose.yml` — base for the new root compose (currently has hardcoded secrets to fix).
- `frontend/src/App.tsx`, `frontend/src/layout/AppLayout.tsx` — central refactor target (`keyForRefresh`, `activeView`, `page` → Router + Query + Zustand).
- `frontend/src/services/apiService.ts` — HTTP layer to keep, now called from Query hooks instead of `useEffect`.
- `frontend/src/types.ts` — current `Goal`/`Transaction` shapes to evolve alongside the new backend entities.
