import { RagService } from "./src/services/rag.service.js";

async function test() {
  console.log("Testing RAG...");
  const results = await RagService.retrieve("Chức năng thanh toán của Quickserve hoạt động thế nào?");
  console.log(`Found ${results.length} results.`);
  if (results.length > 0) {
    console.log("Top result similarity:", results[0].similarity);
  }
}

test().then(() => process.exit(0)).catch(console.error);
