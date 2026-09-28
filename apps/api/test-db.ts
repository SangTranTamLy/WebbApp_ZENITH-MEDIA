import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const sql = postgres(connectionString, { 
  prepare: false, 
  connect_timeout: 10,
});

async function main() {
  try {
    const result = await sql`SELECT 1 as connected`;
    console.log("Connected successfully:", result);
    process.exit(0);
  } catch (err) {
    console.error("Connection error:", err);
    process.exit(1);
  }
}

main();
