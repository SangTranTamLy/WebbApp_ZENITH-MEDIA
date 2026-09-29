async function test() {
  console.log("Fetching Ollama...");
  try {
    const res = await fetch("http://127.0.0.1:11434/api/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "nomic-embed-text", prompt: "Hello" })
    });
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Embedding length:", data.embedding?.length);
  } catch (e) {
    console.error("Fetch failed:", e);
  }
}
test();
