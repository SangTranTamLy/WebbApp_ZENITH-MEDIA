import { CONTACT_RESPONSE, PORTFOLIO_KNOWLEDGE as knowledge, PUBLIC_REFUSAL, type PortfolioProject } from "./portfolio-knowledge.js";
import type { ChatMessage } from "./chat-types.js";

export const normalizeQuestion = (value: string): string => value
  .toLocaleLowerCase("vi-VN").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/đ/g, "d").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

// Whole phrases prevent "hi" matching "chứng chỉ", or "study" selecting
// STUDY ELS when the question actually names STUDY DEV.
export const hasPhrase = (value: string, phrases: readonly string[]): boolean =>
  phrases.some((phrase) => ` ${value} `.includes(` ${normalizeQuestion(phrase)} `));

export function findProjects(value: string): PortfolioProject[] {
  return knowledge.projects.filter((project) => {
    const repo = new URL(project.url).pathname.split("/").pop() ?? "";
    return hasPhrase(value, [project.title, repo, ...(project.title === "QUICKSERVE POS" ? ["quickserve", "quick serve"] : [])]);
  });
}

export function resolveQuestion(messages: ChatMessage[]): string {
  const userMessages = messages.filter((message) => message.role === "user");
  const question = userMessages.at(-1)?.content.trim() ?? "";
  const value = normalizeQuestion(question);
  if (findProjects(value).length || !hasPhrase(value, ["du an do", "du an nay", "project do", "no", "con media", "con code"])) return question;
  // Resolve only the last user turn. Assistant text supplied by a browser is
  // never a source of facts, and older subjects must not leak across topics.
  const previous = normalizeQuestion(userMessages.at(-2)?.content ?? "");
  const projects = findProjects(previous);
  if (projects.length === 1) return `${question}\nDự án đang được hỏi: ${projects[0]!.title}`;
  return question;
}

export type PublicRoute =
  | { kind: "answer"; text: string }
  | { kind: "retrieve"; query: string }
  | { kind: "github"; projects: PortfolioProject[]; profile: boolean };

const answer = (text: string): PublicRoute => ({ kind: "answer", text });
const formatProject = (project: PortfolioProject): string =>
  `- **${project.title}** (${project.category})\n  ${project.description}\n  **Stack:** ${project.stack}\n  **GitHub:** ${project.url}`;
const projectList = () => knowledge.projects.map(formatProject).join("\n\n");
const mediaOverview = () => `**Portfolio Media của ${knowledge.fullName}**\n\n- **Nghệ danh:** ${knowledge.mediaName}.\n- **Kỹ năng được ghi trong hồ sơ:** ${knowledge.mediaSkills}\n- **YouTube:** ${knowledge.social.youtube}\n- **TikTok chính:** ${knowledge.social.tiktokMain}\n- **TikTok AMV:** ${knowledge.social.tiktokAmv}`;
const codeOverview = () => `**Portfolio Code của ${knowledge.fullName}**\n\n- **Tên dùng trong Code:** ${knowledge.codeName} (${knowledge.displayName}).\n- **Học vấn:** ${knowledge.education}\n- **Frontend:** ${knowledge.codeSkills.join(", ")}.\n- **Công nghệ trong portfolio:** ${knowledge.additionalTechnologies.join(", ")}.\n- **Backend:** ${knowledge.backendNote}\n\n**Dự án công khai:**\n\n${projectList()}`;
const aliases = `Khi làm Code, Sang dùng tên **${knowledge.codeName}** (${knowledge.displayName}). Trong Media/Editor, Sang dùng nghệ danh **${knowledge.mediaName}**.`;

export function routePublicQuestion(question: string): PublicRoute {
  const value = normalizeQuestion(question);
  const projects = findProjects(value);
  const media = hasPhrase(value, ["media", "editor", "edit", "tiktok", "youtube", "amv"]);
  const social = hasPhrase(value, ["tiktok", "youtube"]);
  const stats = hasPhrase(value, ["follower", "followers", "star", "stars", "fork", "forks", "view", "views", "like", "likes", "luot", "nguoi theo doi", "thong ke"]);

  if (!value) return answer(PUBLIC_REFUSAL);
  if (hasPhrase(value, ["bo qua", "ignore previous", "system prompt", "system message", "prompt noi bo", "cau hinh he thong", "private", "rieng tu", "noi bo", "secret", "api key", "mat khau", "tu bia"])) return answer(PUBLIC_REFUSAL);
  if (hasPhrase(value, ["chung chi", "ielts", "ngay sinh", "nam sinh", "bao nhieu tuoi", "luong", "diem so", "khach hang", "doanh thu cua sang"])) return answer(PUBLIC_REFUSAL);

  // Current statistics must never be answered with a profile link or stale RAG.
  if (social && (stats || /\b(?:thu|so)\s*\d+\b/.test(value))) return answer(PUBLIC_REFUSAL);
  if (stats) {
    if (projects.length || hasPhrase(value, ["github"])) return { kind: "github", projects, profile: !projects.length };
    return answer(PUBLIC_REFUSAL);
  }
  if (hasPhrase(value, ["bao nhieu repo", "bao nhieu repository", "so repository"])) {
    return { kind: "github", projects: [], profile: true };
  }

  // A subject word alone (notably "Zenith") is not an alias question.
  if (hasPhrase(value, ["method", "medthod", "phuong phap", "cach lam", "phong cach", "plugin", "extension", "kuronai", "compressbase"])) {
    return { kind: "retrieve", query: question };
  }
  if (projects.length) {
    if (hasPhrase(value, ["chuc nang", "chi tiet", "kien truc", "database", "co so du lieu", "bao mat", "dang nhap", "thanh toan", "doanh thu", "khach", "ngay", "gia", "tai sao", "nhu the nao", "co dung", "co ho tro", "co su dung", "co phai"])) {
      return { kind: "retrieve", query: question };
    }
    if (hasPhrase(value, ["gioi thieu", "tong quan", "mo ta", "la gi", "link", "github", "stack", "cong nghe"]) || projects.some((project) => normalizeQuestion(project.title) === value) || value === "quickserve") {
      return answer(projects.map(formatProject).join("\n\n"));
    }
    return { kind: "retrieve", query: question };
  }
  if (hasPhrase(value, ["study"])) return answer("Bạn muốn hỏi về **STUDY ELS** hay **STUDY DEV**? Đây là hai dự án khác nhau.");
  if (hasPhrase(value, ["du an do", "du an nay", "project do"])) return answer("Bạn đang hỏi về dự án nào? Bạn gửi tên dự án để mình tra đúng thông tin nhé.");

  if (/\b(?:du an|project|repo|repository)\b/.test(value)) {
    const generalList = /^(?:(?:hay|ban|sang|cho toi|cho minh|cho biet) )*(?:(?:liet ke|danh sach|cac|nhung|tong hop|gioi thieu) (?:cac |nhung )?(?:du an|project|repo|repository)(?: cong khai)?(?: cua sang)?|(?:du an|project)(?: cua sang)?(?: gom nhung gi| nao| co gi| gom gi)?|co (?:nhung )?(?:du an|project) nao|co bao nhieu (?:du an|project))$/.test(value);
    if (generalList) return answer(`Các dự án Code đang được liệt kê trong portfolio (${knowledge.projects.length} dự án):\n\n${projectList()}`);
    // A random named project must not be replaced with the list of real ones.
    return answer(PUBLIC_REFUSAL);
  }

  if (hasPhrase(value, ["email", "facebook", "discord", "lien he", "contact", "zalo", "so dien thoai", "sdt"])) return answer(CONTACT_RESPONSE);
  if (hasPhrase(value, ["ban la ai", "ban lam duoc gi", "muc dich tao ra", "bot hay nguoi", "ban ten gi", "ten cua ban"])) {
    return answer(`Mình là MDA, trợ lý AI của ${knowledge.fullName}. Mình hỗ trợ tra cứu thông tin công khai về portfolio Code, Media và cách liên hệ Sang.`);
  }
  if (hasPhrase(value, ["ai tao ra", "ai code", "ai lap trinh", "ai viet prompt", "nguoi xay dung"])) return answer(`MDA là chatbot do Sang xây dựng để hỗ trợ tra cứu portfolio và kết nối với Sang.`);
  if (hasPhrase(value, ["biet danh", "nghe danh", "ten trong code", "zenith la ai", "sangtrantamly la ai"]) || ["zenith", "sangtrantamly"].includes(value)) return answer(aliases);

  if (hasPhrase(value, ["portfolio", "gioi thieu sang", "gioi thieu ve sang", "thong tin ve sang", "about sang", "con media", "con code"])) {
    if (hasPhrase(value, ["co phai", "da tung", "bao nhieu", "co dung", "co ho tro"])) return { kind: "retrieve", query: question };
    if (media) return answer(mediaOverview());
    if (hasPhrase(value, ["code", "lap trinh", "developer"])) return answer(codeOverview());
    return answer(`${codeOverview()}\n\n${mediaOverview()}`);
  }
  if (social) {
    if (hasPhrase(value, ["video", "noi dung", "dang", "moi nhat"])) return { kind: "retrieve", query: question };
    const links = [
      ...(hasPhrase(value, ["tiktok"]) ? [`- **TikTok chính:** ${knowledge.social.tiktokMain}`, `- **TikTok AMV:** ${knowledge.social.tiktokAmv}`] : []),
      ...(hasPhrase(value, ["youtube"]) ? [`- **YouTube:** ${knowledge.social.youtube}`] : []),
    ];
    return answer(`Các kênh được ghi trong portfolio:\n\n${links.join("\n")}`);
  }
  if (hasPhrase(value, ["github"])) return answer(`GitHub của Sang: ${knowledge.contacts.github}`);
  if (hasPhrase(value, ["ky nang", "skill", "skills", "frontend", "backend"])) {
    if (hasPhrase(value, ["bao nhieu", "may nam", "co phai", "gioi nhat", "cap do", "senior"])) return { kind: "retrieve", query: question };
    if (media) return answer(mediaOverview());
    return answer(`- **Frontend:** ${knowledge.codeSkills.join(", ")}.\n- **Công nghệ trong portfolio:** ${knowledge.additionalTechnologies.join(", ")}.\n- **Backend:** ${knowledge.backendNote}`);
  }
  if (hasPhrase(value, ["hoc van", "hoc truong nao", "hoc nganh gi"])) return answer(`**Học vấn:** ${knowledge.education}`);
  if (/^(?:(?:cho minh biet|cho toi biet) )?(?:bay gio la )?(?:may gio|hom nay (?:la )?(?:ngay may|thu may)|ngay may|thu may)(?: roi)?$/.test(value)) {
    const now = new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "full", timeStyle: "medium" }).format(new Date());
    return answer(`Hiện tại ở Việt Nam là **${now}**.`);
  }
  if (/^(?:xin chao|chao|hello|hi|hey|alo)(?: ban|mda|bot|sang)?$/.test(value)) return answer(`Chào bạn! Mình là MDA, trợ lý AI của ${knowledge.fullName}. Bạn muốn tìm hiểu về portfolio Code, Media hay cách liên hệ Sang?`);
  return { kind: "retrieve", query: question };
}
