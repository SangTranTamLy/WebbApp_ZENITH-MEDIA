# Database migration path

The checked-in Drizzle migrations are the schema source of truth.

From the repository root, configure `DATABASE_URL` for the intended PostgreSQL database and run:

```text
pnpm api:db:migrate
```

Migration `0000_windy_hydra` creates the knowledge tables and enables `pgvector`. Migration `0001_rag_foundation` adds the retrieval indexes. The API migration command checks that the `vector` extension is available before applying the migration set.

Do not use the deprecated `apps/api/fix-db.ts` or an ad-hoc SQL patch to create or repair these tables. If migration execution cannot reach the database, the result is BLOCKED until `DATABASE_URL` and the database service are available.
