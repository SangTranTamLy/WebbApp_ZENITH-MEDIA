import { sql, type SQL } from "drizzle-orm";
import type { TableName, Tables } from "@zenith/shared";

export interface Database {
  execute(query: SQL): Promise<unknown>;
  transaction<T>(work: (db: Database) => Promise<T>): Promise<T>;
}
function rows<T>(result: unknown): T[] {
  return (
    Array.isArray(result) ? result : (result as { rows: T[] }).rows
  ) as T[];
}
export class Repository {
  constructor(
    private db: Database,
    private insideTransaction = false,
  ) {}
  async get<K extends TableName>(
    table: K,
    id: string,
  ): Promise<Tables[K] | undefined> {
    const result = await this.db.execute(
      sql`select payload from shop.${sql.identifier(table)} where id=${id}`,
    );
    return rows<{ payload: Tables[K] }>(result)[0]?.payload;
  }
  async list<K extends TableName>(
    table: K,
    field?: keyof Tables[K],
    value?: string,
  ): Promise<Tables[K][]> {
    const result = await this.db.execute(
      sql`select payload from shop.${sql.identifier(table)} ${field ? sql`where payload->>${String(field)}=${value}` : sql``} order by id`,
    );
    return rows<{ payload: Tables[K] }>(result).map((row) => row.payload);
  }
  async put<K extends TableName>(
    table: K,
    value: Tables[K],
  ): Promise<Tables[K]> {
    if (!this.insideTransaction)
      throw new Error("Writes require an explicit transaction");
    await this.db.execute(
      sql`insert into shop.${sql.identifier(table)} (id,payload) values (${value.id},${JSON.stringify(value)}::jsonb) on conflict (id) do update set payload=excluded.payload`,
    );
    return value;
  }
  async remove<K extends TableName>(table: K, id: string) {
    if (!this.insideTransaction)
      throw new Error("Writes require an explicit transaction");
    await this.db.execute(
      sql`delete from shop.${sql.identifier(table)} where id=${id}`,
    );
  }
  async transaction<T>(work: (repo: Repository) => Promise<T>): Promise<T> {
    if (this.insideTransaction) return work(this);
    return this.db.transaction(async (db) => {
      // One short database lock serializes financial/catalog mutations across all API instances.
      // External network calls must be outside this lock. Suitable for this single-admin shop.
      await db.execute(
        sql`select id from shop.guard where id='commerce' for update`,
      );
      return work(new Repository(db, true));
    });
  }
}
