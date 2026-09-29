import { useState, useRef, useEffect } from "react";

export type MessageRole = "user" | "assistant" | "system";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
}

export type BotState = "idle" | "greeting" | "thinking" | "typing" | "success" | "error";

export function useChat() {
  const [botState, setBotState] = useState<BotState>("idle");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content: "Chào bạn! Mình là MDA, trợ lý AI của Châu Thanh Sang. Mình chỉ trả lời dựa trên thông tin công khai đã có trong portfolio. ✨\n\nBạn có thể hỏi về kỹ năng, project công khai hoặc cách liên hệ Sang.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getChatEndpoint = () => {
    const configuredApiOrigin = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, "");
    return configuredApiOrigin ? `${configuredApiOrigin}/api/chat` : "/api/chat";
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const botMessageId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: botMessageId, role: "assistant", content: "" },
    ]);

    setBotState("thinking");
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 45_000);

    try {
      // Create the messages array to send to backend
      const apiMessages = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch(getChatEndpoint(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
        signal: controller.signal,
      });

      const contentType = response.headers.get("content-type") ?? "";
      if (!response.ok || !contentType.includes("text/event-stream")) {
        throw new Error(`Chat API returned ${response.status}`);
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let sseBuffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        sseBuffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
        const events = sseBuffer.split("\n\n");
        sseBuffer = events.pop() ?? "";

        for (const event of events) {
          const dataLine = event.split("\n").find((line) => line.startsWith("data: "));
          if (!dataLine) continue;

          const dataStr = dataLine.replace("data: ", "").trim();
          if (dataStr === "[DONE]") {
            setBotState("success");
            setTimeout(() => setBotState("idle"), 3000);
            continue;
          }
          if (!dataStr) continue;

          try {
            const data = JSON.parse(dataStr);
            if (data.text) {
              setBotState("typing");
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === botMessageId
                    ? { ...msg, content: msg.content + data.text }
                    : msg
                )
              );
            }
          } catch {
            console.warn("Failed to parse SSE data chunk", dataStr);
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setBotState("error");
      setTimeout(() => setBotState("idle"), 5000);
      setMessages((prev) => [
        ...prev.map((msg) =>
          msg.id === botMessageId
            ? {
                ...msg,
                content:
                  error instanceof DOMException && error.name === "AbortError"
                    ? "Máy chủ phản hồi quá lâu. Vui lòng thử lại sau ít giây."
                    : "Mình chưa kết nối được máy chủ. Vui lòng thử lại.",
              }
            : msg,
        ),
      ]);
    } finally {
      window.clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  return {
    messages,
    input,
    setInput,
    isLoading,
    sendMessage,
    messagesEndRef,
    botState,
  };
}
