import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import type { Database } from "./repository.js";
import { Repository } from "./repository.js";

export function connectPostgres(url: string) {
  const client = postgres(url, {
    prepare: false,
    max: 5,
    connect_timeout: 10,
    idle_timeout: 20,
  });
  const db = drizzle(client);
  return {
    repository: new Repository(db as unknown as Database),
    close: () => client.end(),
    client,
  };
}
