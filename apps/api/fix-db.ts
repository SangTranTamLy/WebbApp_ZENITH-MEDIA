import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config();

const sql = postgres(process.env.DATABASE_URL as string);

async function fix() {
  console.log("Creating tables...");
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS "knowledge_documents" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "owner_id" uuid,
        "title" text NOT NULL,
        "source_type" varchar(100) NOT NULL,
        "source_uri" text,
        "visibility" varchar(50) DEFAULT 'PUBLIC' NOT NULL,
        "mime_type" varchar(100),
        "checksum" varchar(255),
        "status" varchar(50) DEFAULT 'PROCESSING',
        "metadata" jsonb,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS "knowledge_chunks" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "document_id" uuid NOT NULL,
        "chunk_index" integer,
        "content" text NOT NULL,
        "embedding" vector(768),
        "token_count" integer,
        "metadata" jsonb,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `;

    await sql`
      DO $$ BEGIN
        ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_document_id_knowledge_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "knowledge_documents"("id") ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    console.log("Tables created successfully!");
  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}

fix();
