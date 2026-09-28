import {
  CONTACT_RESPONSE,
  PORTFOLIO_KNOWLEDGE,
  PUBLIC_REFUSAL,
  type PortfolioProject,
} from "./portfolio-knowledge.js";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatChunk = {
  text: () => string;
};

const normalize = (value: string): string =>
  value
    .toLocaleLowerCase("vi-VN")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const includesAny = (value: string, terms: readonly string[]): boolean =>
  terms.some((term) => value.includes(term));

const formatProject = (project: PortfolioProject): string =>
  `- **${project.title}** (${project.category})\n  ${project.description}\n  **Stack:** ${project.stack}\n  **GitHub:** ${project.url}`;

const portfolioOverview = (): string => `**Portfolio Code của ${PORTFOLIO_KNOWLEDGE.fullName}**

- **Tên dùng trong Code:** ${PORTFOLIO_KNOWLEDGE.codeName}
- **Học vấn:** ${PORTFOLIO_KNOWLEDGE.education}
- **Định hướng:** Phát triển sản phẩm web và xây dựng hành trình hướng tới full-stack.
- **Frontend:** ${PORTFOLIO_KNOWLEDGE.codeSkills.join(", ")}.
- **Công nghệ xuất hiện trong portfolio:** ${PORTFOLIO_KNOWLEDGE.additionalTechnologies.join(", ")}.
- **Backend:** ${PORTFOLIO_KNOWLEDGE.backendNote}
- **Công việc:** ${PORTFOLIO_KNOWLEDGE.work}

### Các project công khai

${PORTFOLIO_KNOWLEDGE.projects.map(formatProject).join("\n\n")}

Bạn có thể liên hệ Sang qua [Email](mailto:${PORTFOLIO_KNOWLEDGE.contacts.email}), [Facebook](${PORTFOLIO_KNOWLEDGE.contacts.facebook}) hoặc [Discord](${PORTFOLIO_KNOWLEDGE.contacts.discord}).`;

const projectsResponse = (): string => `Các project Code công khai hiện có trong portfolio:

${PORTFOLIO_KNOWLEDGE.projects.map(formatProject).join("\n\n")}`;

const skillsResponse = (): string => `Thông tin kỹ năng hiện có:

- **Frontend:** ${PORTFOLIO_KNOWLEDGE.codeSkills.join(", ")}.
- **Công nghệ trong portfolio:** ${PORTFOLIO_KNOWLEDGE.additionalTechnologies.join(", ")}.
- **Backend:** ${PORTFOLIO_KNOWLEDGE.backendNote}
- **Media:** ${PORTFOLIO_KNOWLEDGE.mediaSkills}

> Hồ sơ hiện tại không cung cấp thông tin về chứng chỉ, nên mình không thể xác nhận Sang có chứng chỉ nào.`;

const creatorResponse = `Hệ thống Chatbot này được ${PORTFOLIO_KNOWLEDGE.fullName} (${PORTFOLIO_KNOWLEDGE.codeName} / ${PORTFOLIO_KNOWLEDGE.mediaName}) trực tiếp tích hợp và định hình thông qua Prompt Engineering.`;

const identityResponse = `Mình là MDA, trợ lý AI của ${PORTFOLIO_KNOWLEDGE.fullName}. Mình được tạo ra để cung cấp thông tin đã được công khai trong portfolio và hỗ trợ kết nối bạn với Sang để hợp tác làm việc.`;

const aliasesResponse = `Khi làm Code, Sang dùng tên **${PORTFOLIO_KNOWLEDGE.codeName}**. Trong lĩnh vực Media/Editor, Sang dùng nghệ danh **${PORTFOLIO_KNOWLEDGE.mediaName}**. Trên giao diện Code, portfolio cũng hiển thị tên **${PORTFOLIO_KNOWLEDGE.displayName}**.`;

const socialResponse = `Các kênh Media/Sáng tạo của Sang:

- **YouTube:** [@Zenithed_ts](${PORTFOLIO_KNOWLEDGE.social.youtube})
- **TikTok:** [@zenithedi_](${PORTFOLIO_KNOWLEDGE.social.tiktokMain})
- **TikTok AMV:** [@fairytail100yq_mvs](${PORTFOLIO_KNOWLEDGE.social.tiktokAmv})`;

const projectAliases: ReadonlyArray<{ terms: readonly string[]; project: PortfolioProject }> =
  PORTFOLIO_KNOWLEDGE.projects.map((project) => ({
    project,
    terms: [normalize(project.title), normalize(project.title).replace(/\s+/g, "-")],
  }));

const isProjectQuestion = (value: string): boolean =>
  includesAny(value, ["du an", "project", "repo", "repository", "github"]);

const isSpecificUnknownProjectQuestion = (value: string): boolean =>
  isProjectQuestion(value) &&
  includesAny(value, [
    "da tung",
    "tung lam",
    "lam du an",
    "du an ten",
    "project ten",
    "exampleecommerce",
    "examplebusiness",
    "ecommerce",
    "business app",
    "cong ty",
  ]) &&
  !projectAliases.some(({ terms }) => terms.some((term) => value.includes(term)));

const getKnownProject = (value: string): PortfolioProject | undefined =>
  projectAliases.find(({ terms }) => terms.some((term) => value.includes(term)))?.project;

const timeResponse = (): string => {
  const now = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    dateStyle: "full",
    timeStyle: "medium",
  }).format(new Date());

  return `Hiện tại ở Việt Nam là **${now}**.`;
};

const answerPublicMessage = (content: string): string => {
  const value = normalize(content);

  if (!value) return PUBLIC_REFUSAL;

  // Sensitive model/internals questions must never be answered from inference.
  if (
    includesAny(value, [
      "dung model",
      "model ai",
      "ai training",
      "training ra",
      "chatgpt",
      "loi ai",
      "machine learning",
      "prompt noi bo",
      "cau hinh he thong",
      "bo qua quy tac",
      "thong tin rieng tu",
      "tu bia",
    ])
  ) {
    return PUBLIC_REFUSAL;
  }

  if (includesAny(value, ["gio", "thoi gian", "hom nay", "ngay may", "thu may", "bay gio"])) {
    return timeResponse();
  }

  if (includesAny(value, ["sdt", "so dien thoai", "zalo", "email", "facebook", "discord", "lien he", "contact"])) {
    return CONTACT_RESPONSE;
  }

  if (includesAny(value, ["ban la ai", "ban lam duoc gi", "muc dich tao ra", "bot hay nguoi", "co phai sang dang chat"])) {
    return identityResponse;
  }

  if (includesAny(value, ["ai tao ra", "ai code", "ai lap trinh", "ai viet prompt", "nguoi xay dung"])) {
    return creatorResponse;
  }

  if (includesAny(value, ["sangtrantamly", "zenith", "biet danh", "nghe danh"])) {
    return aliasesResponse;
  }

  if (includesAny(value, ["youtube", "tiktok", "kenh media", "mang xa hoi"])) {
    return socialResponse;
  }

  if (isSpecificUnknownProjectQuestion(value)) return PUBLIC_REFUSAL;

  const knownProject = getKnownProject(value);
  if (knownProject) return formatProject(knownProject);

  if (isProjectQuestion(value)) return projectsResponse();

  if (includesAny(value, ["ky nang", "skill", "frontend", "backend", "html", "css", "javascript", "react", "typescript", "node", "express", "postgresql", "chung chi"])) {
    return skillsResponse();
  }

  if (includesAny(value, ["hoc van", "sinh vien", "truong", "nganh hoc", "cong nghe phan mem"])) {
    return `**Học vấn:** ${PORTFOLIO_KNOWLEDGE.education}`;
  }

  if (
    includesAny(value, [
      "portfolio",
      "gioi thieu sang",
      "sang thanh sang",
      "thong tin ve sang",
      "about sang",
    ])
  ) {
    return portfolioOverview();
  }

  if (/(^|\s)(xin chao|chao|hello|hi|hey|alo)(\s|$)/.test(value)) {
    return `Chào bạn! Mình là MDA, trợ lý AI của ${PORTFOLIO_KNOWLEDGE.fullName}. Bạn có thể hỏi mình về portfolio, kỹ năng, project công khai hoặc cách liên hệ Sang.`;
  }

  return PUBLIC_REFUSAL;
};

export class AIService {
  static async *generateChatStream(messages: unknown[], role: "PUBLIC" | "PRIVATE" = "PUBLIC"): AsyncGenerator<ChatChunk> {
    // Private mode is intentionally unavailable from the public chat endpoint.
    // Keeping this guard here prevents a future caller from silently reintroducing
    // the old ungrounded private prompt.
    if (role !== "PUBLIC") {
      throw new Error("Private chat is not enabled on the public chatbot endpoint.");
    }

    const safeMessages = messages.filter(
      (message): message is ChatMessage =>
        typeof message === "object" &&
        message !== null &&
        "role" in message &&
        "content" in message &&
        ((message as { role?: unknown }).role === "user" ||
          (message as { role?: unknown }).role === "assistant") &&
        typeof (message as { content?: unknown }).content === "string",
    );

    const lastUserMessage = [...safeMessages].reverse().find((message) => message.role === "user");
    const response = answerPublicMessage(lastUserMessage?.content ?? "");

    yield { text: () => response };
  }
}
