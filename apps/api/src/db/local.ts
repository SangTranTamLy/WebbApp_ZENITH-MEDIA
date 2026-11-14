import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Repository, type Database } from "./repository.js";

export async function connectLocal(dataDir?: string) {
  const client = new PGlite(dataDir);
  const ready = await client.query<{ exists: boolean }>(
    "select exists (select 1 from information_schema.tables where table_schema='shop' and table_name='guard')",
  );
  if (!ready.rows[0].exists) {
    const migration = await readFile(
      fileURLToPath(new URL("../../migrations/0000_shop.sql", import.meta.url)),
      "utf8",
    );
    const security = await readFile(
      fileURLToPath(
        new URL("../../migrations/0001_security.sql", import.meta.url),
      ),
      "utf8",
    );
    await client.exec(migration);
    await client.exec(security);
  }
  const identity = await client.query<{ exists: boolean }>(
    "select exists (select 1 from information_schema.columns where table_schema='shop' and table_name='entitlements' and column_name='right_key')",
  );
  if (!identity.rows[0].exists)
    await client.exec(
      await readFile(
        new URL("../../migrations/0002_ownership.sql", import.meta.url),
        "utf8",
      ),
    );
  const db = drizzle(client);
  return {
    repository: new Repository(db as unknown as Database),
    client,
    close: () => client.close(),
  };
}
