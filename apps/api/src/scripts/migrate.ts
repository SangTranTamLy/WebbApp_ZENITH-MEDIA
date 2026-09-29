import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config();

const runMigrate = async () => {
  console.log("Running migrations...");
  const sql = postgres(process.env.DATABASE_URL as string, { max: 1 });
  const db = drizzle(sql);
  
  try {
    await migrate(db, { migrationsFolder: "./src/db/migrations" });
    console.log("Migrations applied successfully.");
  } catch (err) {
    console.error("Migration failed", err);
  } finally {
    await sql.end();
  }
};

runMigrate().catch(console.error);
