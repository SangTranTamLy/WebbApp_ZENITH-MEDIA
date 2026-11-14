import { config } from "dotenv";
import postgres from "postgres";
config({ quiet: true });
const url = process.env.SHOP_DATABASE_URL;
const expected = process.env.SHOP_DATABASE_HOST_CONFIRM;
if (!url || !expected || new URL(url).hostname !== expected)
  throw new Error(
    "Set SHOP_DATABASE_URL and SHOP_DATABASE_HOST_CONFIRM for the new project. Inventory is read-only; legacy DATABASE_URL is never used.",
  );
const client = postgres(url, { prepare: false, max: 1, connect_timeout: 8 });
try {
  const result = await client.begin("read only", async (tx) => ({
    database: await tx`select current_database() as name,current_user as role`,
    tables:
      await tx`select table_schema,table_name from information_schema.tables where table_schema in ('public','auth','storage','shop') order by 1,2`,
    policies:
      await tx`select schemaname,tablename,policyname,roles,cmd from pg_policies where schemaname in ('public','storage','shop')`,
    triggers:
      await tx`select trigger_schema,event_object_table,trigger_name from information_schema.triggers where trigger_schema='public'`,
    functions:
      await tx`select routine_schema,routine_name from information_schema.routines where routine_schema='public'`,
    authCount: await tx`select count(*)::int as count from auth.users`,
    buckets: await tx`select id,name,public from storage.buckets`,
  }));
  console.log(
    JSON.stringify({ host: new URL(url).hostname, ...result }, null, 2),
  );
} catch (error) {
  console.error(
    "Read-only inventory failed:",
    (error as { code?: string }).code ?? (error as Error).name,
    (error as Error).message
      .replace(/postgres(?:ql)?:\/\/\S+/g, "[redacted]")
      .replace(new URL(url).password, "[redacted]"),
  );
  process.exitCode = 1;
} finally {
  await client.end();
}
