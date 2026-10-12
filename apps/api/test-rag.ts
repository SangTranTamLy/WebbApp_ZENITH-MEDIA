import { RagService } from "./src/services/rag.service.js";

async function test() {
  console.log("Testing RAG...");
  const results = await RagService.retrieve("Chức năng thanh toán của Quickserve hoạt động thế nào?");
  console.log(`Found ${results.length} results.`);
  const topResult = results[0];
  if (topResult) {
    console.log("Top result similarity:", topResult.similarity);
  }
}

test().then(() => process.exit(0)).catch(console.error);
