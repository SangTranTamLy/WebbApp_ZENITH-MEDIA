import * as dotenv from "dotenv";
dotenv.config();

async function testChat() {
  console.log("Testing AIService directly...");
  const { AIService } = await import("./src/services/ai.service");
  
  try {
    const stream = await AIService.generateChatStream([{ role: "user", content: "Hi" }], "PUBLIC");
    for await (const chunk of stream) {
      process.stdout.write(chunk.text() || "");
    }
    console.log("\n--- DONE ---");
  } catch (e: any) {
    console.error("OpenAI Error:", JSON.stringify(e, null, 2));
    if (e.error) {
      console.error("Inner Error:", JSON.stringify(e.error, null, 2));
    }
  }
}

testChat();
