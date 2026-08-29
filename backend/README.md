# Finly backend (NestJS + TypeORM)

## How to run via Docker (recommended)

The `docker-compose.yml` lives at the repo root, not here (it brings up the backend + database together).

```bash
cp ../.env.example ../.env   # fill in DB_PASSWORD, JWT_SECRET, and GRAFANA_ADMIN_PASSWORD
cd ..
docker compose up --build    # first run / after Dockerfile changes
docker compose up -d         # subsequent runs, in the background
```

TypeORM migrations run automatically (`migrationsRun: true`) as soon as the backend container starts — there's no more manual `db:init` step.

This brings up: Postgres, the backend at `http://localhost:3001`, the frontend at `http://localhost:3000` (Nginx serving the production build, with `/api` already proxied to the backend — that's the URL you open in the browser, not `:3001`), Prometheus at `http://localhost:9090` (scraping `/api/metrics` every 15s), and Grafana at `http://localhost:3300` (log in with `admin`/`GRAFANA_ADMIN_PASSWORD`, with the Prometheus datasource and a "Finly Backend" dashboard already provisioned — see `infra/prometheus/` and `infra/grafana/`).

## Local development (without Docker)

```bash
npm install
npm run start:dev      # watch mode, reads variables from backend/.env
```

## Tests

```bash
npm run test           # unit tests (Vitest, no external dependencies)
npm run test:e2e       # e2e (Supertest) — needs a real Postgres with migrations applied
```

## Migrations

```bash
npm run migration:generate   # generate a migration from entity changes
npm run migration:run        # apply pending migrations manually (outside Docker)
npm run migration:revert     # revert the last migration
```
