export type PortfolioProject = {
  title: string;
  category: string;
  description: string;
  stack: string;
  url: string;
};

// This is the only public source of truth used by the chatbot.
// Do not add inferred facts, certifications, clients, dates, or placeholder URLs here.
export const PORTFOLIO_KNOWLEDGE = {
  fullName: "Thanh Sang",
  codeName: "SangTranTamLy",
  mediaName: "Zenith",
  displayName: "T.Sang",
  education: "Sinh viên ngành Công nghệ phần mềm tại Trường Đại học Hùng Vương TP.HCM.",
  codeSkills: ["HTML", "CSS", "JavaScript", "React"],
  additionalTechnologies: [
    "TypeScript",
    "Node.js",
    "Express",
    "PostgreSQL",
    "Vite",
    "CSS3",
    "Framer Motion",
  ],
  backendNote: "Đang học và phát triển thêm Backend.",
  mediaSkills: "AMV, highlight/montage game (Gacha, Valorant), flow và VFX cơ bản.",
  work: "Nhận dự án Freelance (Code & Edit).",
  contacts: {
    discord: "https://discord.gg/omniforge",
    email: "sangchaubr089@gmail.com",
    facebook: "https://www.facebook.com/Luxny.Sang",
    github: "https://github.com/SangTranTamLy",
  },
  social: {
    youtube: "https://www.youtube.com/@Zenithed_ts",
    tiktokMain: "https://www.tiktok.com/@zenithedi_",
    tiktokAmv: "https://www.tiktok.com/@fairytail100yq_mvs",
  },
  projects: [
    {
      title: "QUICKSERVE POS",
      category: "Featured / Full-stack",
      description:
        "Nền tảng POS quản lý sản phẩm, đơn hàng, hóa đơn, kho, ca làm việc, khuyến mãi và báo cáo doanh thu.",
      stack: "React · TypeScript · Node.js · Express",
      url: "https://github.com/SangTranTamLy/pos-system-online",
    },
    {
      title: "STUDY ELS",
      category: "Learning product",
      description:
        "Giao diện học tiếng Anh với flashcard, từ điển, dịch thuật, bài kiểm tra và luyện tập có hỗ trợ AI.",
      stack: "Frontend · Product Design",
      url: "https://github.com/SangTranTamLy/Study-ELS",
    },
    {
      title: "STUDY DEV",
      category: "Personal project",
      description:
        "Portfolio cá nhân ghi lại kỹ năng kỹ thuật, các thử nghiệm và hành trình hướng tới phát triển full-stack.",
      stack: "Portfolio · Web Design",
      url: "https://github.com/SangTranTamLy/Study-DEV",
    },
    {
      title: "ZENITH WORKSPACE",
      category: "Monorepo",
      description: "Portfolio hiện tại, được xây dựng với design system thống nhất và kiến trúc backend.",
      stack: "React · Express · Node.js",
      url: "https://github.com/SangTranTamLy/zenith-workspace",
    },
  ] satisfies PortfolioProject[],
} as const;

export const PUBLIC_REFUSAL = `Hiện tại mình chưa có đủ thông tin để trả lời câu hỏi này.

Tuy nhiên, bạn có thể liên hệ trực tiếp với Sang qua:
- **Discord:** [OMNIFORGE COMMUNITY](${PORTFOLIO_KNOWLEDGE.contacts.discord})
- **Email:** [${PORTFOLIO_KNOWLEDGE.contacts.email}](mailto:${PORTFOLIO_KNOWLEDGE.contacts.email})
- **Facebook:** [Châu Thanh Sang (Luxny)](${PORTFOLIO_KNOWLEDGE.contacts.facebook})

Sang sẽ trực tiếp giải đáp cho bạn nhé! ✨`;

export const CONTACT_RESPONSE = `Hiện tại Sang không công khai Zalo/SĐT. Bạn vui lòng liên hệ qua các kênh dưới đây nhé:

- **Facebook:** [Châu Thanh Sang (Luxny)](${PORTFOLIO_KNOWLEDGE.contacts.facebook})
- **Discord:** [OMNIFORGE COMMUNITY](${PORTFOLIO_KNOWLEDGE.contacts.discord})
- **Email:** [${PORTFOLIO_KNOWLEDGE.contacts.email}](mailto:${PORTFOLIO_KNOWLEDGE.contacts.email})`;
