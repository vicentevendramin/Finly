# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Finly (formerly "Meu Termômetro Financeiro") is a full-stack personal finance tracker (Portuguese-language UI, undergoing an English rebrand). It's a monorepo with two independent projects — `backend/` and `frontend/` — each with its own `package.json` and no shared root tooling.

**Note:** this project is mid-refactor per `PLAN.md` at the repo root — backend core (auth + transactions on NestJS/TypeORM) and Docker infra are done; Goals/Reports/Admin/Observability backend modules and the entire frontend refactor (router, TanStack Query, Zustand, i18n, design system) are still pending. Check `PLAN.md`'s task table for current status before assuming a section is finished.

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
cp .env.example .env   # fill in DB_PASSWORD and JWT_SECRET
docker compose up --build   # first run / after Dockerfile changes — builds + starts Postgres + backend
docker compose up -d        # subsequent runs, detached
```
Migrations run automatically on backend container startup (`migrationsRun: true` in `TypeOrmModule`) — no manual init step.

### Frontend (`frontend/`)
```bash
npm run dev        # Vite dev server on port 3000
npm run build      # tsc -b && vite build
npm run lint       # eslint .
npm run preview    # preview production build
```

## Architecture

### Backend — NestJS modules (`backend/src/`)
Standard Nest module-per-domain layout: `auth/`, `users/`, `transactions/`, `database/`, `config/`, `common/`, `health/`. Requests flow **controller → service → TypeORM repository**, with DI wiring the controller's `@UseGuards(JwtAuthGuard)` to the `auth/` module.

- `main.ts` — global prefix `api`, CORS (from `FRONTEND_URL` env var), global `ValidationPipe` (class-validator DTOs), global `HttpExceptionFilter`
- `common/filters/http-exception.filter.ts` — normalizes every error response back to `{error: string}` (not Nest's default `{statusCode, message, error}`) so the frontend's `apiService.ts` doesn't need to change
- `auth/` — `JwtStrategy` + `JwtAuthGuard` (`@nestjs/passport`); any module whose controller uses `JwtAuthGuard` must import `AuthModule` (it exports the configured `PassportModule`), not just declare the guard — see `transactions/transactions.module.ts` for the pattern
- `users/entities/user.entity.ts` — has a `role: 'user' | 'admin'` column already, unused until the admin-panel module lands
- `transactions/` — `TransactionsService` maps TypeORM's `numeric` columns (returned as strings by `pg`) back to JS numbers, and dates stay as plain `YYYY-MM-DD` strings, matching what the frontend expects
- `database/database.module.ts` — `TypeOrmModule.forRootAsync` reading `DB_HOST/PORT/NAME/USER/PASSWORD`, `synchronize: false`, `migrationsRun: true`; `database/data-source.ts` is a separate `DataSource` for the TypeORM CLI (`migration:generate`/`run`/`revert`), not used by the running app
- `database/migrations/` — hand-written initial migration (no legacy data to preserve); every future schema change needs a new migration file here

Every transactions query is scoped by the JWT's decoded user id — when adding new endpoints on any per-user resource, preserve this pattern (see `transactions.service.ts`'s `update`/`remove`: look up scoped by `{id, user: {id: userId}}`, not by id alone).

Env vars come from `backend/.env` locally (see `backend/.env.example`) or from the root `.env` file when using Docker Compose (see `.env.example` at the repo root). Neither real `.env` file is tracked in git.

### Frontend — single-page, prop-drilled state (no router, no global state library)
`App.tsx` is the root state owner: it holds `user`, the current `page` ('login' | 'register' | 'app'), `activeView` (which section of the app is shown), and modal/editing state. There is no React Router — page/view switching is done via conditional rendering and a `page`/`activeView` string state machine.

- `App.tsx` → `AppLayout` (`layout/AppLayout.tsx`) → `Sidebar` + the active page component (`pages/DashboardPage.tsx`, `TransactionsPage.tsx`, `GoalsPage.tsx`, `ReportsPage.tsx`), selected via a switch on `activeView`
- Data refresh pattern: mutating a transaction bumps a `keyForRefresh` counter in `App.tsx`, passed down as the `key` prop on page components — this forces React to remount and refetch rather than using a data-fetching cache library
- `services/apiService.ts` is the sole HTTP boundary: wraps `fetch`, injects the JWT from `localStorage` on every request, normalizes non-2xx responses into thrown `Error`s with the backend's `error` message. Add new backend calls here, not with ad-hoc `fetch` in components.
- `types.ts` defines the shared domain types (`User`, `Transaction`, `NewTransactionData`, `Goal`, `ActiveView`) used across frontend and mirrored by the backend's JSON shape (numeric amounts, `id` as string, dates as `YYYY-MM-DD`)
- `GoalsPage` and `ReportsPage` are currently placeholder ("em construção") — there is no backend support for goals/reports yet. `components/GoalsList.tsx` exists but isn't wired into `GoalsPage`.
- Vite `base` is `/` (self-hosted via Docker/nginx, not GitHub Pages); `VITE_API_URL` env var overrides the default `http://localhost:3001/api` backend URL.
