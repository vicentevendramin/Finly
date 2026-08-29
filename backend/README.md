# Finly backend (NestJS + TypeORM)

## Como inicializar via Docker (recomendado)

O `docker-compose.yml` fica na raiz do repositório, não aqui (sobe backend + banco juntos).

```bash
cp ../.env.example ../.env   # preencha DB_PASSWORD, JWT_SECRET e GRAFANA_ADMIN_PASSWORD
cd ..
docker compose up --build    # primeira vez / após mudanças no Dockerfile
docker compose up -d         # subsequentes, em segundo plano
```

As migrations do TypeORM rodam automaticamente (`migrationsRun: true`) assim que o container do backend sobe — não há mais um passo manual de `db:init`.

Isso sobe: Postgres, o backend em `http://localhost:3001`, Prometheus em `http://localhost:9090` (raspando `/api/metrics` a cada 15s) e Grafana em `http://localhost:3300` (login `admin`/`GRAFANA_ADMIN_PASSWORD`, já com o datasource do Prometheus e um dashboard "Finly Backend" provisionados — ver `infra/prometheus/` e `infra/grafana/`).

## Desenvolvimento local (sem Docker)

```bash
npm install
npm run start:dev      # watch mode, lê variáveis de backend/.env
```

## Testes

```bash
npm run test           # unit tests (Vitest, sem dependências externas)
npm run test:e2e       # e2e (Supertest) — precisa de um Postgres real com as migrations aplicadas
```

## Migrations

```bash
npm run migration:generate   # gera uma migration a partir de mudanças nas entities
npm run migration:run        # aplica migrations pendentes manualmente (fora do Docker)
npm run migration:revert     # desfaz a última migration
```
