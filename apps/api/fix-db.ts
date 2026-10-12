console.error("fix-db.ts is deprecated and intentionally performs no direct DDL.");
console.error("Run `pnpm api:db:migrate` so the checked-in Drizzle migrations remain the schema source of truth.");
process.exitCode = 1;
