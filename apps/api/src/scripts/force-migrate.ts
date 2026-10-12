import { db } from "../db/index.js";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Forcing creation of message_feedbacks table...");
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "message_feedbacks" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "message_id" uuid NOT NULL,
        "is_positive" boolean NOT NULL,
        "reason" text,
        "corrected_response" text,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    console.log("Table created successfully (or already exists).");
    process.exit(0);
  } catch (error) {
    console.error("Error creating table:", error);
    process.exit(1);
  }
}

main();
