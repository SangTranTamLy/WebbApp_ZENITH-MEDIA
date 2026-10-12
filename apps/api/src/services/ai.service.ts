import { PUBLIC_REFUSAL } from "./portfolio-knowledge.js";
import { RagService } from "./rag.service.js";
import { GithubService, type GithubCacheEntry } from "./github.service.js";
import { buildEvidence, validateEvidenceSelection } from "./grounded-answer.js";
import { EvidenceModel } from "./evidence-model.js";
import { resolveQuestion, routePublicQuestion } from "./public-chat-policy.js";
import { abortable, ChatUnavailableError, type ChatChunk, type ChatMessage, type ChatSource } from "./chat-types.js";

function freshStats(entry: GithubCacheEntry): boolean {
  return entry.status === "SUCCESS" && entry.value !== null && entry.expires_at > Date.now()
    && Number.isFinite(entry.fetched_at) && entry.fetched_at <= Date.now();
}

export class AIService {
  static async *generateChatStream(messages: unknown[], role: "PUBLIC" | "PRIVATE" = "PUBLIC", signal = AbortSignal.timeout(35_000)): AsyncGenerator<ChatChunk> {
    if (role !== "PUBLIC") throw new Error("Private chat is not enabled on the public chatbot endpoint.");
    signal.throwIfAborted();
    const safeMessages = messages.filter((message): message is ChatMessage => {
      if (!message || typeof message !== "object") return false;
      const item = message as Record<string, unknown>;
      return (item.role === "user" || item.role === "assistant") && typeof item.content === "string";
    }).slice(-24);
    const question = resolveQuestion(safeMessages);
    const route = routePublicQuestion(question);
    if (route.kind === "answer") {
      yield { text: () => route.text };
      return;
    }

    // Official GitHub numbers don't require the knowledge database or an LLM.
    if (route.kind === "github") {
      const results = await abortable(Promise.all(route.profile
        ? [GithubService.getProfileStats(signal)]
        : route.projects.map((project) => GithubService.getRepoStats(new URL(project.url).pathname.split("/").pop()!, signal))), signal);
      if (results.some((result) => !freshStats(result))) {
        yield { text: () => "Mình chưa lấy được số liệu GitHub hiện tại. Bạn vui lòng thử lại sau; mình không dùng số liệu đã hết hạn." };
        return;
      }
      const sources: ChatSource[] = results.map((result, i) => ({
        documentId: result.source_url, title: route.profile ? "GitHub SangTranTamLy" : route.projects[i]!.title,
        sourceType: "GITHUB", sourceUri: result.source_url, chunkIndex: null,
      }));
      const text = results.map((result, i) => {
        const stats = route.profile
          ? `${result.value.followers} followers, ${result.value.public_repos} repository công khai`
          : `${result.value.stars} stars, ${result.value.forks} forks`;
        const fetched = new Date(result.fetched_at).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
        return `**${sources[i]!.title}:** ${stats}.\nLấy dữ liệu lúc ${fetched} (giờ Việt Nam).`;
      }).join("\n\n");
      yield { text: () => text, sources };
      return;
    }

    let contexts;
    try {
      contexts = await abortable(RagService.retrieve(route.query, 3, signal), signal);
    } catch {
      signal.throwIfAborted();
      throw new ChatUnavailableError("KNOWLEDGE_UNAVAILABLE");
    }
    const evidence = buildEvidence(route.query, contexts);
    if (!evidence.length) {
      yield { text: () => PUBLIC_REFUSAL };
      return;
    }
    let output: string;
    try {
      output = await abortable(EvidenceModel.select(route.query, evidence, signal), signal);
    } catch {
      signal.throwIfAborted();
      throw new ChatUnavailableError("MODEL_UNAVAILABLE");
    }
    const grounded = validateEvidenceSelection(output, evidence);
    // Do not stream model prose or sources before validating the entire selection.
    if (!grounded) {
      yield { text: () => PUBLIC_REFUSAL };
      return;
    }
    yield { text: () => grounded.text, sources: grounded.sources };
  }
}
