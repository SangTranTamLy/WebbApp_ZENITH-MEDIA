# Zenith Media Workspace & MDA AI Assistant

> **Two paths. One vision. Code meets cinema.**  
> A personal portfolio, creative media showcase, and intelligent AI assistant built by **[T.Sang](https://github.com/SangTranTamLy)**.

[![React](https://img.shields.io/badge/Frontend-React%2019-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Backend-Express%205-lightgrey?style=flat-square&logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%2F%20Supabase-336791?style=flat-square&logo=postgresql)](https://supabase.com/)
[![pnpm](https://img.shields.io/badge/Monorepo-pnpm%20workspaces-orange?style=flat-square&logo=pnpm)](https://pnpm.io/)

Domain dự kiến: [zenith.io.vn](https://zenith.io.vn)

---

## 📑 Mục Lục (Table of Contents)

1. [Tổng Quan (Overview)](#-tổng-quan-overview)
2. [Các Tính Năng Cốt Lõi (Core Features)](#-các-tính-năng-cốt-lõi-core-features)
   - [Trang Chủ (Landing Page)](#1-trang-chủ-landing-page)
   - [Khu Lập Trình (Code Portfolio)](#2-khu-lập-trình-code-portfolio)
   - [Khu Biên Tập & Media (Editor Portfolio)](#3-khu-biên-tập--media-editor-portfolio)
   - [Trợ Lý AI Đại Diện (MDA AI Assistant)](#4-trợ-lý-ai-đại-diện-mda-ai-assistant)
3. [Công Nghệ Sử Dụng (Tech Stack)](#-công-nghệ-sử-dụng-tech-stack)
4. [Cấu Trúc Thư Mục (Repository Structure)](#-cấu-trúc-thư-mục-repository-structure)
5. [Hướng Dẫn Cài Đặt & Khởi Chạy (Getting Started)](#-hướng-dẫn-cài-đặt--khởi-chạy-getting-started)
   - [Yêu cầu hệ thống](#1-yêu-cầu-hệ-thống)
   - [Cài đặt gói phụ thuộc](#2-cài-đặt-gói-phụ-thuộc)
   - [Cấu hình biến môi trường (.env)](#3-cấu-hình-biến-môi-trường-env)
   - [Khởi chạy môi trường phát triển (Dev)](#4-khởi-chạy-môi-trường-phát-triển-dev)
6. [Các Lệnh Thường Dùng (Useful Scripts)](#-các-lệnh-thường-dùng-useful-scripts)
7. [Tác Giả & Liên Hệ (Author)](#-tác-giả--liên-hệ-author)

---

## 🚀 Tổng Quan (Overview)

**Zenith Media Workspace** không chỉ là một trang web portfolio cá nhân thông thường. Đây là một không gian sáng tạo tích hợp (Creative Studio) dung hợp hai niềm đam mê lớn: **Kỹ thuật phần mềm (Code)** và **Hậu kỳ video / Điện ảnh (Media & Editing)**.

Dự án được trang bị **MDA (Multi-Domain Assistant)** — trợ lý AI độc quyền có khả năng tương tác trực tiếp với khách truy cập, giải đáp về năng lực công nghệ, quy trình biên tập và số liệu dự án của tác giả dựa trên cơ sở tri thức đã được kiểm chứng (Grounded RAG).

---

## ✨ Các Tính Năng Cốt Lõi (Core Features)

### 1. Trang Chủ (Landing Page)
- **Định vị 2 lối đi rõ ràng:** Lựa chọn khám phá khu vực **Engineering (CODE)** hoặc **Post-Production (EDITOR)**.
- **Hiệu ứng thị giác hiện đại:** Ambient neon lighting, thẻ bài tương tác 3D tilt theo con trỏ chuột (Framer Motion).
- **Banner giới thiệu MDA:** Tích hợp lối tắt làm quen nhanh với trợ lý AI.

### 2. Khu Lập Trình (Code Portfolio) — `/code`
- Trình diễn năng lực kỹ thuật Full-Stack: React 19, TypeScript, Express, PostgreSQL, Drizzle ORM.
- Danh sách công nghệ được phân nhóm trực quan với hiệu ứng 3D hover.
- Trưng bày các dự án mã nguồn tiêu biểu (QuickServe POS, Zenith Workspace, Study ELS, v.v.).

### 3. Khu Biên Tập & Media (Editor Portfolio) — `/editor`
- Không gian dành riêng cho đam mê AMV / Motion Graphics và nghệ thuật kể chuyện bằng hình ảnh.
- Bảng công cụ chuyên dụng: Adobe After Effects, Premiere Pro, Photoshop cùng hệ thống plugin cao cấp (BCC, Flow, Layer Fast, Kuronai / Method render 60fps).
- Showcase các tác phẩm video nổi bật liên kết trực tiếp với kênh TikTok sáng tạo.

### 4. Trợ Lý AI Đại Diện (MDA AI Assistant)
- **Floating Chat Widget:** Cửa sổ chat phong cách glassmorphism mượt mà, hỗ trợ render Markdown và code blocks.
- **Server-Sent Events (SSE):** Phản hồi văn bản dạng streaming thời gian thực.
- **Kiến trúc RAG & Grounded Answering:** Tìm kiếm dữ liệu liên quan qua vector embeddings (`pgvector`) và đối soát bằng chứng nhằm ngăn chặn triệt để hiện tượng AI bịa đặt (anti-hallucination).
- **Live GitHub Stats:** Tự động lấy số lượng followers, repos, stars thực tế thông qua GitHub API khi người dùng hỏi.
- **Hỗ trợ đa mô hình:** Tương thích với Google Gemini SDK (`gemini-3.1-flash-lite`) trên production hoặc mô hình Local (Qwen 2.5 qua Ollama) khi phát triển cục bộ.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

| Phân hệ | Công nghệ | Mục đích |
|---|---|---|
| **Frontend Web** | React 19, TypeScript, Vite | Xây dựng giao diện Single Page App tốc độ cao |
| **Animation & Styling** | Framer Motion, Vanilla CSS (Variables) | Hiệu ứng chuyển động mượt, tối ưu hiệu năng |
| **Backend API** | Node.js, Express 5, TypeScript | REST API, SSE Streaming cho Chatbot MDA |
| **Database & ORM** | PostgreSQL (Supabase), Drizzle ORM | Lưu trữ dữ liệu hội thoại, feedback và tri thức |
| **Vector Search** | pgvector (`nomic-embed-text` / Gemini) | Truy xuất ngữ nghĩa phục vụ RAG |
| **AI Engine** | Google Gemini / Qwen 2.5 (Ollama) | Xử lý ngôn ngữ tự nhiên và trả lời hội thoại |
| **Monorepo** | pnpm workspaces | Quản lý đa gói ứng dụng đồng nhất |

---

## 📁 Cấu Trúc Thư Mục (Repository Structure)

```text
zenith-workspace/
├── apps/
│   ├── api/                     # Backend API & MDA AI Service (Express 5)
│   │   ├── src/
│   │   │   ├── controllers/     # Chat & Feedback controllers
│   │   │   ├── db/              # Drizzle ORM schema & migrations
│   │   │   ├── middlewares/     # Auth, rate-limit, CORS
│   │   │   ├── routes/          # /api/chat, /api/feedback
│   │   │   ├── services/        # AIService, RagService, EmbeddingService, GithubService
│   │   │   └── server.ts        # Entry point máy chủ API
│   │   └── package.json
│   │
│   └── web/                     # Frontend Application (React 19 + Vite)
│       ├── src/
│       │   ├── app/             # AppRouter, AppProviders
│       │   ├── components/      # Layouts & UI chung
│       │   ├── features/
│       │   │   ├── ai-chat/     # Floating ChatWidget, streaming hooks, styles
│       │   │   └── portfolio/   # Components khu Code & khu Editor
│       │   ├── pages/           # LandingPage, CodePortfolioPage, EditorPortfolioPage
│       │   └── styles/          # Design tokens (variables.css, animations.css)
│       └── package.json
│
├── ai/
│   └── mda/                     # AI Workspace của MDA (Datasets, Prompts, LoRA configs)
├── scripts/                     # Scripts nạp dữ liệu (ingestion) và kiểm tra deploy
├── supabase/                    # Các tệp SQL migration cho database & vector
├── package.json                 # Root monorepo scripts
└── pnpm-workspace.yaml          # Cấu hình pnpm workspaces
```

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy (Getting Started)

### 1. Yêu cầu hệ thống
- **Node.js:** `>= 20.x`
- **pnpm:** `>= 10.x` hoặc `11.x`
- **PostgreSQL:** Hỗ trợ extension `vector` (khuyên dùng Supabase)

### 2. Cài đặt gói phụ thuộc
Tải mã nguồn về máy và cài đặt thư viện từ thư mục gốc:

```bash
git clone https://github.com/SangTranTamLy/zenith-workspace.git
cd zenith-workspace
pnpm install
```

### 3. Cấu hình biến môi trường (.env)

#### A. Backend API (`apps/api/.env`)
Tạo tệp `apps/api/.env` dựa theo mẫu:

```env
# Server
PORT=4000
NODE_ENV=development
WEB_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173

# Database (PostgreSQL + pgvector)
DATABASE_URL="postgresql://postgres:password@localhost:5432/postgres"

# AI Configuration
# Lựa chọn 1: Dùng Gemini API (Production / Cloud)
GEMINI_API_KEY="AIzaSy..."

# Lựa chọn 2: Dùng Local LLM qua Ollama (Cục bộ)
# AI_MODEL_URL="http://127.0.0.1:11434"
AI_MODEL_NAME="gemini-3.1-flash-lite"
EMBEDDING_MODEL="gemini-embedding-001"
```

#### B. Frontend Web (`apps/web/.env`)
Tạo tệp `apps/web/.env`:

```env
VITE_API_BASE_URL=http://localhost:4000
VITE_REALTIME_ENABLED=true
```

### 4. Khởi chạy môi trường phát triển (Dev)

Khởi chạy đồng thời cả hai ứng dụng từ thư mục gốc:

```bash
# Chạy Backend API (Port 4000)
pnpm --filter @zenith/api dev

# Chạy Frontend Web (Port 5173)
pnpm --filter @zenith/web dev
```

Truy cập trình duyệt tại: `http://localhost:5173`

---

## ⚡ Các Lệnh Thường Dùng (Useful Scripts)

| Lệnh | Ý nghĩa |
|---|---|
| `pnpm --filter @zenith/web dev` | Chạy dev server của ứng dụng Web |
| `pnpm --filter @zenith/api dev` | Chạy dev server của ứng dụng API |
| `pnpm --filter @zenith/api db:migrate` | Chạy migration cấu trúc cơ sở dữ liệu |
| `pnpm --filter @zenith/api ingest` | Nạp dữ liệu tri thức portfolio vào vector store |
| `pnpm web:build` | Build bundle cho ứng dụng Frontend |
| `pnpm api:build` | Build TypeScript cho ứng dụng Backend |
| `pnpm api:typecheck` | Kiểm tra lỗi kiểu dữ liệu ở API |

---

## 👤 Tác Giả & Liên Hệ (Author)

**T.Sang (SangTranTamLy)**  
*Full-Stack Developer & Video Editor*

- **GitHub:** [@SangTranTamLy](https://github.com/SangTranTamLy)
- **Email:** [sangchaubr089@gmail.com](mailto:sangchaubr089@gmail.com)
- **TikTok (Editing):** [@zenithedi_](https://www.tiktok.com/@zenithedi_)
- **TikTok (MVS):** [@fairytail100yq_mvs](https://www.tiktok.com/@fairytail100yq_mvs)

---

<div align="center">
  <sub>Xây dựng với niềm đam mê dành cho Code & Cinema. Powered by MDA AI.</sub>
</div>
