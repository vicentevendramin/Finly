# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Finly (formerly "Meu Termômetro Financeiro") is a full-stack personal finance tracker (Portuguese-language UI, undergoing an English rebrand). It's a monorepo with two independent projects — `backend/` and `frontend/` — each with its own `package.json` and no shared root tooling.

**Note:** this project is mid-refactor per `PLAN.md` at the repo root — the entire backend (NestJS/TypeORM, all modules incl. Goals/Reports/Admin/Observability) and the Docker/Prometheus/Grafana infra are done; the frontend refactor (router, TanStack Query, Zustand, i18n, design system, and consuming the new Goals/Reports/Admin endpoints) has not started. Check `PLAN.md`'s task table for current status before assuming a section is finished.

- **Frontend:** React 19 + TypeScript + Vite, styled with Tailwind CSS v4 (not yet refactored — still the original prop-drilled architecture, see below)
- **Backend:** NestJS 12 (ESM, Vitest, oxlint — the current `nest new` defaults) + TypeORM + PostgreSQL
- **Auth:** JWT via `@nestjs/passport`, passwords hashed with `bcryptjs`, token stored in `localStorage` on the frontend
- Backend has unit tests (Vitest, mocked repositories) and e2e tests (Supertest against a real Postgres); frontend has none yet.

## Commands

Run these from within `backend/` or `frontend/` respectively — there is no root-level script runner, except the Docker Compose file which lives at the repo root.

### Backend (`backend/`)
```bash
npm run start:dev        # watch mode (reads backend/.env)
npm run build            # nest build -> dist/
npm run test             # unit tests (Vitest, no external deps)
npm run test:e2e         # e2e tests (Supertest) — needs a real Postgres with migrations applied
npm run migration:generate  # generate a migration from entity changes
npm run migration:run       # apply pending migrations manually (outside Docker)
```

Via Docker, from the repo root (see root `docker-compose.yml` and `backend/README.md`):
```bash
cp .env.example .env   # fill in DB_PASSWORD, JWT_SECRET, GRAFANA_ADMIN_PASSWORD
docker compose up --build   # first run / after Dockerfile changes — builds + starts everything
docker compose up -d        # subsequent runs, detached
```
Brings up Postgres, the backend (`:3001`), Prometheus (`:9090`, scraping `backend:3001/api/metrics` every 15s — config in `infra/prometheus/`), and Grafana (`:3300`, datasource + a starter dashboard auto-provisioned from `infra/grafana/provisioning/`). Migrations run automatically on backend container startup (`migrationsRun: true` in `TypeOrmModule`) — no manual init step.

### Frontend (`frontend/`)
```bash
npm run dev        # Vite dev server on port 3000
npm run build      # tsc -b && vite build
npm run lint       # eslint .
npm run preview    # preview production build
```

## Architecture

### Backend — NestJS modules (`backend/src/`)
Standard Nest module-per-domain layout: `auth/`, `users/`, `transactions/`, `goals/`, `reports/`, `admin/`, `observability/`, `database/`, `config/`, `common/`, `health/`. Requests flow **controller → service → TypeORM repository**, with DI wiring the controller's `@UseGuards(JwtAuthGuard)` to the `auth/` module.

- `main.ts` — global prefix `api`, CORS (from `FRONTEND_URL` env var), global `ValidationPipe` (class-validator DTOs). The global exception filter is *not* set up here — see `common/` below.
- `common/common.module.ts` — registers `HttpExceptionFilter` as `APP_FILTER` (DI-managed, not `new`'d in `main.ts`, because it injects the `ErrorLog` repository). It normalizes every error response to `{error: string}` (not Nest's default `{statusCode, message, error}`) so the frontend's `apiService.ts` doesn't need to change, and persists 5xx/unhandled errors to `ErrorLog` (best-effort — a failed log write never breaks the actual error response) for the admin panel to read.
- `common/guards/roles.guard.ts` + `common/decorators/roles.decorator.ts` — `@Roles(UserRole.ADMIN)` + `@UseGuards(JwtAuthGuard, RolesGuard)` gates a route on the JWT payload's `role` claim (see `admin/admin.controller.ts`). There's no self-service promotion endpoint — the first admin is promoted with a one-off `UPDATE users SET role='admin' WHERE email=...`.
- `auth/` — `JwtStrategy` + `JwtAuthGuard` (`@nestjs/passport`); any module whose controller uses `JwtAuthGuard` must import `AuthModule` (it exports the configured `PassportModule`), not just declare the guard — see `transactions/transactions.module.ts` for the pattern. The JWT payload carries `{id, email, role}`.
- `transactions/` — `TransactionsService` maps TypeORM's `numeric` columns (returned as strings by `pg`) back to JS numbers, and dates stay as plain `YYYY-MM-DD` strings, matching what the frontend expects. Every query is scoped by the JWT's decoded user id — when adding endpoints on any per-user resource, preserve this pattern (see `update`/`remove`: look up scoped by `{id, user: {id: userId}}`, not by id alone).
- `goals/` — hybrid progress model: a `Goal` optionally links to a transaction `category`; `GoalsService.computeProgress()` sums manual `GoalContribution` rows *plus* matching `income`-type transactions in that category, computed on read (never stored, so it can't drift).
- `reports/` — pure aggregate queries over `Transaction` (no new entities): balance-by-period, category breakdown, month-over-month (a convenience wrapper around balance-by-period), and CSV/PDF export (`ReportsController.export` uses `@Res()` directly to stream the file — bypasses the JSON response cycle).
- `observability/` — `/api/metrics` via `@prometheus-io/client` (the official successor to the now-deprecated `prom-client`; used directly since `@willsoto/nestjs-prometheus` doesn't support Nest 12 yet), with a global `MetricsInterceptor` (`APP_INTERCEPTOR`) recording `http_requests_total`/`http_request_duration_seconds` labeled by matched route pattern. `health/health.controller.ts` runs a real `SELECT 1` against the `DataSource` and 503s if it fails.
- `database/database.module.ts` — `TypeOrmModule.forRootAsync` reading `DB_HOST/PORT/NAME/USER/PASSWORD`, `synchronize: false`, `migrationsRun: true` (migrations apply automatically on every boot, incl. in Docker). `database/data-source.ts` is a separate `DataSource` for the TypeORM CLI (`migration:generate`/`run`/`revert`), not used by the running app — keep its `entities` array in sync with `database.module.ts`'s.
- `database/migrations/` — currently a single generated `InitSchema` migration (repeatedly squashed back to one clean migration during this pre-deployment phase, since decision #6 in `PLAN.md` says no data needs preserving yet). **Once this is actually deployed for real use, stop squashing — start writing additive migrations instead.** Always run `migration:generate` against a live Postgres and eyeball the diff (or `migration:generate` twice in a row expecting "no changes") rather than hand-writing migrations — entity decorator options (`nullable`, `@Check`, index names) are easy to get out of sync with hand-written SQL, and TypeORM's generator will happily surface that drift.

Env vars come from `backend/.env` locally (see `backend/.env.example`) or from the root `.env` file when using Docker Compose (see `.env.example` at the repo root). Neither real `.env` file is tracked in git.

Test conventions: unit tests (`*.spec.ts`, colocated with source) mock repositories/query builders and need no external services. e2e tests (`backend/test/*.e2e-spec.ts`) boot the real `AppModule` via `test/utils/bootstrap-app.ts` against a real Postgres (env vars same as dev) with migrations already applied — `npm run test:e2e` rebuilds first (`pretest:e2e`) since `DatabaseModule` loads compiled migrations from `dist/`, and `vitest.config.e2e.ts` disables file parallelism because every spec file's `beforeAll` independently triggers `migrationsRun` against the same database.

### Frontend — single-page, prop-drilled state (no router, no global state library)
`App.tsx` is the root state owner: it holds `user`, the current `page` ('login' | 'register' | 'app'), `activeView` (which section of the app is shown), and modal/editing state. There is no React Router — page/view switching is done via conditional rendering and a `page`/`activeView` string state machine.

- `App.tsx` → `AppLayout` (`layout/AppLayout.tsx`) → `Sidebar` + the active page component (`pages/DashboardPage.tsx`, `TransactionsPage.tsx`, `GoalsPage.tsx`, `ReportsPage.tsx`), selected via a switch on `activeView`
- Data refresh pattern: mutating a transaction bumps a `keyForRefresh` counter in `App.tsx`, passed down as the `key` prop on page components — this forces React to remount and refetch rather than using a data-fetching cache library
- `services/apiService.ts` is the sole HTTP boundary: wraps `fetch`, injects the JWT from `localStorage` on every request, normalizes non-2xx responses into thrown `Error`s with the backend's `error` message. Add new backend calls here, not with ad-hoc `fetch` in components.
- `types.ts` defines the shared domain types (`User`, `Transaction`, `NewTransactionData`, `Goal`, `ActiveView`) used across frontend and mirrored by the backend's JSON shape (numeric amounts, `id` as string, dates as `YYYY-MM-DD`)
- `GoalsPage` and `ReportsPage` are currently placeholder ("em construção") — there is no backend support for goals/reports yet. `components/GoalsList.tsx` exists but isn't wired into `GoalsPage`.
- Vite `base` is `/` (self-hosted via Docker/nginx, not GitHub Pages); `VITE_API_URL` env var overrides the default `http://localhost:3001/api` backend URL.
