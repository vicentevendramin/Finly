# Finly backend (NestJS + TypeORM)

## Como inicializar via Docker (recomendado)

O `docker-compose.yml` fica na raiz do repositório, não aqui (sobe backend + banco juntos).

```bash
cp ../.env.example ../.env   # preencha DB_PASSWORD e JWT_SECRET
cd ..
docker compose up --build    # primeira vez / após mudanças no Dockerfile
docker compose up -d         # subsequentes, em segundo plano
```

As migrations do TypeORM rodam automaticamente (`migrationsRun: true`) assim que o container do backend sobe — não há mais um passo manual de `db:init`.

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
