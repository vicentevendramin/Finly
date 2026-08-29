# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Finly (formerly "Meu Termômetro Financeiro") is a full-stack personal finance tracker (Portuguese-language UI, undergoing an English rebrand). It's a monorepo with two independent projects — `backend/` and `frontend/` — each with its own `package.json` and no shared root tooling.

**Note:** this project is mid-refactor — migrating the backend from Express to NestJS + TypeORM, and the frontend to React Router + TanStack Query + Zustand + i18next, per the plan at the top of this repo's git history around the "refactor" commits. Verify which parts of this doc still match reality before relying on it.

- **Frontend:** React 19 + TypeScript + Vite, styled with Tailwind CSS v4
- **Backend:** Node.js + Express 5, PostgreSQL via `pg` (no ORM — raw SQL)
- **Auth:** JWT (`jsonwebtoken`), passwords hashed with `bcryptjs`, token stored in `localStorage` on the frontend

There are no automated tests in this repository yet.

## Commands

Run these from within `backend/` or `frontend/` respectively — there is no root-level script runner.

### Backend (`backend/`)
```bash
npm run dev        # start with nodemon (auto-reload)
npm start          # start with plain node
npm run db:init    # create/verify Postgres tables (src/db/init.js) — run after first `docker-compose up`
```

Via Docker (see `backend/README.md`):
```bash
docker-compose up --build   # first run / after Dockerfile changes — starts Postgres + backend
docker exec -it finance_backend npm run db:init   # initialize DB schema inside the container
docker-compose up -d        # subsequent runs, detached
```

### Frontend (`frontend/`)
```bash
npm run dev        # Vite dev server on port 3000
npm run build      # tsc -b && vite build
npm run lint       # eslint .
npm run preview    # preview production build
```

## Architecture

### Backend — layered Express app
`src/server.js` wires everything: CORS (origin from `FRONTEND_URL` env var), JSON body parsing, then mounts routers at `/api/auth` and `/api/transactions`, plus `/api/health`. Requests flow **routes → middleware → controllers → db pool**:

- `src/routes/*.js` — declares endpoints, applies `authMiddleware` to protected routes (all of `/api/transactions/*` via `router.use(authMiddleware)`)
- `src/middleware/auth.js` — verifies the `Authorization: Bearer <token>` JWT, injects `req.user` (`{ id, email }`)
- `src/controllers/*Controller.js` — request validation + SQL queries via the shared `pg` `Pool` (no service/repository layer)
- `src/config/database.js` — the singleton `pg.Pool`, configured from `DB_HOST`/`DB_PORT`/`DB_NAME`/`DB_USER`/`DB_PASSWORD` env vars
- `src/db/init.js` — idempotent schema setup (`CREATE TABLE IF NOT EXISTS`) for `users` and `transactions`; run manually, not on server boot

Every transactions query is scoped by `user_id` from the decoded JWT — when adding new transaction endpoints, preserve this per-user isolation (see `updateTransaction`/`deleteTransaction` in `transactionsController.js` for the pattern: verify ownership before mutating).

Env vars are loaded via `dotenv` from `backend/.env`. **Note:** `backend/.env` is currently committed to git (backend's `.gitignore` only excludes `node_modules`) — treat any secrets in it as already exposed, and be careful not to add new secrets there without addressing this.

### Frontend — single-page, prop-drilled state (no router, no global state library)
`App.tsx` is the root state owner: it holds `user`, the current `page` ('login' | 'register' | 'app'), `activeView` (which section of the app is shown), and modal/editing state. There is no React Router — page/view switching is done via conditional rendering and a `page`/`activeView` string state machine.

- `App.tsx` → `AppLayout` (`layout/AppLayout.tsx`) → `Sidebar` + the active page component (`pages/DashboardPage.tsx`, `TransactionsPage.tsx`, `GoalsPage.tsx`, `ReportsPage.tsx`), selected via a switch on `activeView`
- Data refresh pattern: mutating a transaction bumps a `keyForRefresh` counter in `App.tsx`, passed down as the `key` prop on page components — this forces React to remount and refetch rather than using a data-fetching cache library
- `services/apiService.ts` is the sole HTTP boundary: wraps `fetch`, injects the JWT from `localStorage` on every request, normalizes non-2xx responses into thrown `Error`s with the backend's `error` message. Add new backend calls here, not with ad-hoc `fetch` in components.
- `types.ts` defines the shared domain types (`User`, `Transaction`, `NewTransactionData`, `Goal`, `ActiveView`) used across frontend and mirrored by the backend's JSON shape (numeric amounts, `id` as string, dates as `YYYY-MM-DD`)
- `GoalsPage` and `ReportsPage` are currently placeholder ("em construção") — there is no backend support for goals/reports yet. `components/GoalsList.tsx` exists but isn't wired into `GoalsPage`.
- Vite `base` is `/` (self-hosted via Docker/nginx, not GitHub Pages); `VITE_API_URL` env var overrides the default `http://localhost:3001/api` backend URL.
