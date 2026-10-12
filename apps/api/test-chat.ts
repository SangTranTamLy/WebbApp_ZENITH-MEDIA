import { AIService } from './src/services/ai.service.js';

async function testChat() {
  console.log("Q: Hãy giới thiệu ngắn gọn về Sang?");
  const messages = [{ role: 'user' as const, content: 'Hãy giới thiệu ngắn gọn về Sang?' }];

  console.log(`Đang sử dụng Model: ${process.env.GEMINI_API_KEY ? "Gemini 1.5 Flash (Production)" : "Ollama (Local Fallback)"}`);

  try {
    const stream = AIService.generateChatStream(messages, 'PUBLIC');
    let response = "";

    process.stdout.write("A: ");
    for await (const chunk of stream) {
      if (chunk.text) {
        const t = chunk.text();
        response += t;
        process.stdout.write(t);
      }
    }
    console.log("\n");
  } catch(e) {
    console.error("Lỗi:", e);
  }
}

testChat().catch(console.error);
