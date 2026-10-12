import type { ChatSource } from "./chat-types.js";
import type { RetrievalResult } from "./rag.service.js";
import { normalizeQuestion } from "./public-chat-policy.js";

export type Evidence = { id: string; text: string; source: ChatSource };
const stopWords = new Set("toi minh ban hay cho biet hoi ve cua sang chau thanh la gi co khong dung su duoc nhung nao cac va voi thi o trong tren nay do no mot the nhu chi tiet them du an project dang bay gio".split(" "));
const searchTerms = (text: string): string[] => [...new Set(normalizeQuestion(text)
  .replace(/medthod|phuong phap/g, "method")
  .split(" ").filter((term) => term && !stopWords.has(term)))];

export function publicSource(context: RetrievalResult): ChatSource {
  let sourceUri: string | null = null;
  try {
    const url = new URL(context.sourceUri ?? "");
    if (["http:", "https:"].includes(url.protocol) && !url.username && !url.password) sourceUri = url.href;
  } catch { /* Local file paths remain internal. */ }
  return { documentId: context.documentId, title: context.title, sourceType: context.sourceType,
    sourceUri, chunkIndex: context.chunkIndex };
}

export function buildEvidence(question: string, contexts: RetrievalResult[]): Evidence[] {
  const terms = searchTerms(question);
  if (!terms.length) return [];
  const evidence: Evidence[] = [];
  for (const context of contexts.slice(0, 3)) {
    if (!Number.isFinite(context.similarity) || context.similarity <= 0.5) continue;
    const titleTerms = searchTerms(context.title);
    for (const paragraph of context.content.split(/\n\s*\n/)) {
      const text = paragraph.trim();
      // Keep complete paragraphs (including negations). The model cannot rewrite
      // a factual claim, supply a URL, or shorten away a qualifying sentence.
      if (text.length < 15 || text.length > 1600) continue;
      if (/ignore (?:all|previous)|system\s*prompt|bo qua (?:quy tac|huong dan)/i.test(normalizeQuestion(text))) continue;
      const available = new Set([...titleTerms, ...searchTerms(text)]);
      if (!terms.every((term) => available.has(term))) continue;
      evidence.push({ id: `E${evidence.length + 1}`, text, source: publicSource(context) });
      if (evidence.length === 12) return evidence;
    }
  }
  return evidence;
}

function quoteText(text: string): string {
  // Retrieved images/links cannot initiate requests; only public source links
  // are rendered as links by the UI.
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/[\\`*_{}\[\]()!|#]/g, "\\$&").split("\n").map((line) => `> ${line}`).join("\n");
}

export function validateEvidenceSelection(output: string, evidence: Evidence[]): { text: string; sources: ChatSource[] } | null {
  let parsed: unknown;
  try { parsed = JSON.parse(output); } catch { return null; }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const record = parsed as Record<string, unknown>;
  if (Object.keys(record).length !== 1 || !Array.isArray(record.evidenceIds) || !record.evidenceIds.length || record.evidenceIds.length > 3) return null;
  const chosen: Evidence[] = [];
  for (const id of record.evidenceIds) {
    const item = evidence.find((candidate) => candidate.id === id);
    if (typeof id !== "string" || !item || chosen.includes(item)) return null;
    chosen.push(item);
  }
  const sources = [...new Map(chosen.map((item) => [`${item.source.documentId}:${item.source.chunkIndex}`, item.source])).values()];
  return { text: `Mình tìm thấy các đoạn sau trong tài liệu công khai:\n\n${chosen.map((item) => quoteText(item.text)).join("\n\n")}`, sources };
}
