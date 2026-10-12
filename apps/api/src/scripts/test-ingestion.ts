import assert from "node:assert/strict";
import {
  assertSafeDocument,
  chunkTextWithOverlap,
  parseLocalDocument,
  sha256Text,
  UnsupportedDocumentFormatError,
  UnsafeDocumentError,
} from "../services/knowledge-ingestion.service.js";
import { isPublicReadyDocument } from "../services/rag-policy.js";

function testChunking(): void {
  const source = "0123456789".repeat(80);
  const chunks = chunkTextWithOverlap(source, 100, 20);
  assert(chunks.length > 1);
  assert(chunks.every((chunk) => chunk.length <= 100));
  assert.equal(chunks[0]?.slice(-20), chunks[1]?.slice(0, 20));
}

function testChecksum(): void {
  assert.equal(sha256Text("same"), sha256Text("same"));
  assert.notEqual(sha256Text("same"), sha256Text("changed"));
}

async function testFormatAndSecretGuards(): Promise<void> {
  await assert.rejects(
    () => parseLocalDocument("portfolio.pdf"),
    (error: unknown) => error instanceof UnsupportedDocumentFormatError && error.message.includes("PDF/XLSX"),
  );
  assert.throws(
    () => assertSafeDocument("notes.txt", "password=do-not-ingest"),
    (error: unknown) => error instanceof UnsafeDocumentError,
  );
  assert.throws(
    () => assertSafeDocument(".env", "SAFE=not-relevant"),
    (error: unknown) => error instanceof UnsafeDocumentError,
  );
}

function testVisibilityPolicy(): void {
  assert.equal(isPublicReadyDocument({ visibility: "PUBLIC", status: "READY" }), true);
  assert.equal(isPublicReadyDocument({ visibility: "PUBLIC", status: "COMPLETED" }), true);
  assert.equal(isPublicReadyDocument({ visibility: "PRIVATE", status: "READY" }), false);
  assert.equal(isPublicReadyDocument({ visibility: "PUBLIC", status: "PROCESSING" }), false);
  assert.equal(isPublicReadyDocument({ visibility: "PUBLIC", status: "ERROR" }), false);
}

testChunking();
testChecksum();
await testFormatAndSecretGuards();
testVisibilityPolicy();
console.log("Ingestion unit checks passed: chunking, checksum, format/secret guards, visibility policy.");
