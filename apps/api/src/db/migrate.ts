import "dotenv/config";
import { readFile } from "node:fs/promises";
import { connectPostgres } from "./connect.js";

const url = process.env.SHOP_DATABASE_URL;
const expected = process.env.SHOP_DATABASE_HOST_CONFIRM;
if (!url || !expected || new URL(url).hostname !== expected)
  throw new Error(
    "Set SHOP_DATABASE_URL and SHOP_DATABASE_HOST_CONFIRM to the verified host. This creates only the new shop schema.",
  );
const { client, close } = connectPostgres(url);
try {
  await client.begin(async (tx) => {
    await tx.unsafe("create schema if not exists shop");
    await tx.unsafe(
      "create table if not exists shop.migrations (name text primary key, applied_at timestamptz not null default now())",
    );
    await tx.unsafe("lock table shop.migrations in exclusive mode");
    for (const name of [
      "0000_shop.sql",
      "0001_security.sql",
      "0002_ownership.sql",
    ]) {
      if (
        (await tx`select name from shop.migrations where name=${name}`).length
      )
        continue;
      const source = await readFile(
        new URL(`../../migrations/${name}`, import.meta.url),
        "utf8",
      );
      await tx.unsafe(source.replace('CREATE SCHEMA "shop";', ""));
      await tx`insert into shop.migrations (name) values (${name})`;
    }
  });
  console.log(
    "Shop migrations applied. Existing application/Auth/Storage schemas were not changed.",
  );
} finally {
  await close();
}
