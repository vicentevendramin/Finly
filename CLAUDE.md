# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Finly (formerly "Meu Termômetro Financeiro") is a full-stack personal finance tracker. The UI is bilingual — pt-BR (default/fallback) and en-US — via i18next. It's a monorepo with two independent projects — `backend/` and `frontend/` — each with its own `package.json` and no shared root tooling.

**Note:** the full refactor described in `PLAN.md` at the repo root is complete — backend (NestJS/TypeORM, all modules), the Docker/Prometheus/Grafana/frontend self-hosted stack, the entire frontend feature set (routing, query caching, i18n, design system), the Finly rebrand, and basic test coverage on both sides are all done. `PLAN.md`'s task table has the full history if you need the "why" behind a decision.

- **Frontend:** React 19 + TypeScript + Vite, React Router 7 + TanStack Query + Zustand, styled with Tailwind CSS v4
- **Backend:** NestJS 12 (ESM, Vitest, oxlint — the current `nest new` defaults) + TypeORM + PostgreSQL
- **Auth:** JWT via `@nestjs/passport`, passwords hashed with `bcryptjs`, token stored in `localStorage` on the frontend
- Backend has unit tests (Vitest, mocked repositories) and e2e tests (Supertest against a real Postgres). Frontend has Vitest + Testing Library tests (jsdom) — intentionally basic coverage, see the frontend Architecture section.

## Commands

Run these from within `backend/` or `frontend/` respectively — there is no root-level script runner, except the Docker Compose file which lives at the repo root.

### Backend (`backend/`)
```bash
npm run start:dev        # watch mode (reads backend/.env)
npm run build            # nest build -> dist/
npm run test             # unit tests (Vitest, no external deps)
npm run test -- src/transactions/transactions.service.spec.ts   # single unit-test file
npm run test -- -t "computeProgress"                            # single test by name
npm run test:e2e         # e2e tests (Supertest) — needs a real Postgres with migrations applied; rebuilds first, file parallelism disabled
npm run lint             # oxlint src/ test/ (NOT eslint — that's the frontend)
npm run format           # prettier --write over src/ + test/ (backend only has a formatter script)
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
npm run dev         # Vite dev server on port 3000
npm run build       # tsc -b && vite build
npm run lint        # eslint . (NOT oxlint — that's the backend; frontend has no formatter script)
npm run preview     # preview production build
npm run test        # Vitest run (jsdom, Testing Library)
npm run test:watch  # Vitest watch mode
# single file:  npm run test -- src/hooks/useTransactions.spec.tsx
# single test:  npm run test -- -t "invalidates the goals query"
```
There is no `vitest.config.ts` on the frontend — test config lives in `vite.config.ts`'s `test` block. Specs are colocated with source: `services/apiService.spec.ts`, `hooks/useTransactions.spec.tsx`, `hooks/useGoals.spec.tsx`, `components/GoalCard.spec.tsx`, `components/NewTransactionModal.spec.tsx`, `routes/routeGuards.spec.tsx`.

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

### Frontend — React Router + TanStack Query + Zustand
`App.tsx` no longer owns any app state — it only does the one-time auth bootstrap (`apiService.checkAuthStatus()` on mount, showing a loading screen until that resolves) and declares routes. Login/Register live at `/login`/`/register` (gated by `routes/PublicOnlyRoute.tsx`, which bounces an already-logged-in user to `/app/dashboard`); everything else lives under `/app/*` (gated by `routes/ProtectedRoute.tsx`, which bounces to `/login` if there's no user) rendered inside `layout/AppLayout.tsx`'s `<Outlet/>`.

- `store/authStore.ts` — Zustand, holds `user: User | null` + `setUser`. This is the single source of truth for "who's logged in"; `Sidebar`, the route guards, and the login/register pages all read/write it directly instead of receiving it as a prop.
- `store/uiStore.ts` — Zustand, holds the new-transaction-modal's `isModalOpen`/`editingTransaction` + `openNewModal`/`openEditModal`/`closeModal`. `AppLayout` renders the single `NewTransactionModal` instance and wires its `onSave` to the right mutation (create vs. update) based on `editingTransaction`.
- `hooks/useTransactions.ts` — `useTransactions()` (query) + `useCreateTransaction`/`useUpdateTransaction`/`useDeleteTransaction` (mutations, each invalidating the `['transactions']` query key on success). This is what replaced the old `keyForRefresh` remount-to-refetch hack entirely — pages no longer manage their own loading/error state by hand.
- `services/apiService.ts` is unchanged as the sole HTTP boundary (wraps `fetch`, injects the JWT from `localStorage`, normalizes errors) — it's now called from inside Query hooks instead of `useEffect`. Add new backend calls here, then wrap them in a hook under `hooks/`.
- Pages (`DashboardPage`, `TransactionsPage`) take **no props** now — they pull data from the Query hooks and UI actions from the stores directly. Don't reintroduce prop-drilling for this; add a store or a hook instead.
- `GoalsPage` is fully wired to the backend Goals module (`hooks/useGoals.ts`): CRUD via `GoalFormModal`, manual contributions via `GoalCard`'s inline form, category-link is a plain text field (goals and transactions both use freeform categories — no fixed list exists anywhere). `components/GoalsList.tsx` (the Dashboard widget) also consumes `useGoals()` now, no more fake data. Since goal progress is derived from transactions server-side, `useCreateTransaction`/`useUpdateTransaction`/`useDeleteTransaction` all invalidate the `['goals']` query key too, not just `['transactions']` — remember this when adding anything else that can affect a goal's computed progress. `ReportsPage` is fully wired to the backend Reports module (`hooks/useReports.ts`): a shared date-range filter scopes the balance chart, category breakdown, and CSV/PDF export; month-over-month has its own month-count selector. Charts use Recharts under `components/reports/`, following the project's dataviz method (`styles/chartColors.ts`): income/expense reuse the app's own `success`/`danger` semantic tokens rather than generic categorical colors, while the category breakdown (real categorical data, unbounded cardinality) uses a validated CVD-safe 8-hue palette assigned by category name — not by value rank, so a category keeps its color across different date ranges — capped at 7 slices + "Other". Every chart has a plain-HTML data table underneath it (accessibility + a non-JS fallback), not just the SVG. CSV/PDF export downloads via `apiService.exportReport()` returning a `Blob`, turned into an `<a download>` click — this is the one place in the app that talks to the backend outside the JSON request/response cycle.
- **Gotcha hit while building Goals**: the backend's CORS `methods` list in `main.ts` didn't include `PATCH`, silently blocking the Goals update endpoint with a CORS preflight failure (fixed). If you add a new HTTP verb to any controller, check that list.
- **Gotcha hit while building Reports**: `reports.service.ts` uses `createQueryBuilder().getRawMany()` for aggregate queries, which bypasses TypeORM's entity column transformers — a Postgres `date` column comes back as a JS `Date` object here, not the plain `YYYY-MM-DD` string the repository layer (used everywhere else, e.g. `transactions.service.ts`) normalizes it to. `exportTransactions` now explicitly converts before formatting; if you add another raw query touching a `date`/`timestamptz` column, do the same.
- **Gotcha hit while building Admin**: `AuthService`'s register/login/me response only included `{id, email}` — the frontend had no way to know a user's role without this, since the JWT itself isn't decoded client-side. Added `role` to `AuthUser` (`auth.service.ts`). If you add more fields the frontend needs to branch on, they need to go through this same response shape, not just the JWT payload.
- `types.ts` defines the shared domain types (`User`, `Transaction`, `NewTransactionData`, `Goal`) mirrored by the backend's JSON shape (numeric amounts, `id` as string, dates as `YYYY-MM-DD`). `ActiveView` was removed — the active route replaced it.
- `index.css` defines the design tokens (Tailwind v4 `@theme`: `primary`/`accent`/`success`/`danger` color scales) and the `dark` custom variant; `STYLEGUIDE.md` documents the palette, component conventions, and responsive breakpoints — read it before styling something new. Dark mode is class-based (`store/themeStore.ts` toggles `.dark` on `<html>`, persisted to `localStorage`), not just `prefers-color-scheme`. There's no `tailwind.config.js` — v4 doesn't need one for this project.
- Responsive nav shell: `Sidebar` becomes an off-canvas drawer below `md` (state in `uiStore.isMobileMenuOpen`, opened via the hamburger in `AppLayout`'s mobile-only topbar, auto-closes on navigation), static at `md+`. `AppLayout` wraps routed content in `max-w-[1600px] mx-auto` so pages don't need to handle ultra-wide monitors themselves.
- `i18n/index.ts` initializes i18next (pt-BR default/fallback, en-US the other supported language) with a single `translation` namespace per locale under `i18n/locales/<locale>/translation.json`, grouped by page/component (`sidebar.*`, `auth.login.*`, `dashboard.*`, etc.) — add new keys there, not inline strings. `components/LanguageSwitcher.tsx` (in the Sidebar) is the only UI for switching; `i18next-browser-languagedetector` persists the choice to `localStorage`. **Gotcha:** several pages `.map()` over transactions using `t` as the loop variable name — that shadows `useTranslation()`'s `t()` function, so this codebase names that variable `tx` instead; keep doing that in new code.
- `AdminPage` (`/app/admin`) is gated both by role and by route: `routes/AdminRoute.tsx` redirects to `/app/dashboard` if `user.role !== 'admin'`, and the Sidebar only renders the "Admin" nav link for admins — but the real enforcement is still server-side (`RolesGuard`); this is UX, not security. `User.role` comes from the auth response (`login`/`register`/`me`), not decoded from the JWT client-side.
- Vite `base` is `/` (self-hosted via Docker/nginx, not GitHub Pages). In the Docker image, `VITE_API_URL` is baked in at build time as `/api` (a relative, same-origin path — see `frontend/Dockerfile`'s `ARG`/`ENV`), and `frontend/nginx.conf` reverse-proxies `/api/*` to the `backend` service internally, so the browser never needs to know the backend's hostname/port and CORS never enters the picture for this path. Local `npm run dev` still falls back to `apiService.ts`'s hardcoded `http://localhost:3001/api` unless a `.env`/shell `VITE_API_URL` overrides it. **Gotcha:** the frontend container's healthcheck must hit `http://127.0.0.1/`, not `http://localhost/` — the container resolves `localhost` to `::1` first and nginx only binds IPv4, so the IPv6 attempt fails with "connection refused" even though the app is up.
- Frontend tests: Vitest + Testing Library, configured in `vite.config.ts`'s `test` block (jsdom environment, `src/test/setup.ts` initializes i18next to a fixed `pt-BR` and registers jest-dom matchers). `src/test/queryWrapper.tsx` provides a fresh `QueryClient` per test for hooks that use TanStack Query. `npm run test` / `npm run test:watch`. Coverage is intentionally basic (mirrors the backend's own scope), not exhaustive — the day-to-day feature verification for this app has mostly been scripted headless-browser walkthroughs (see git history), not this suite.
