# Zenith Media Workspace & MDA AI Assistant

A next-generation personal portfolio, media showcase, and reusable code snippets library built by [T.Sang](https://github.com/SangTranTamLy). 

Zenith is not just a static portfolio—it is powered by **MDA (Multi-Domain Assistant)**, an intelligent AI representative built directly into the core experience. MDA actively analyzes the portfolio, introduces Sang's background in Code and Media, and provides an interactive gateway for visitors to explore projects, technical decisions, and media creations.

> Planned domain: [zenith.io.vn](https://zenith.io.vn)

## Overview

Zenith is structured around four primary pillars:

- **MDA AI Assistant (Interactive Avatar)** — An intelligent, context-aware chatbot using Google's latest Gemini models. MDA acts as a personal representative, answering questions about Sang's skills, projects, and media work in real-time.
- **Developer & Media Portfolio** — A cinematic presentation of personal branding, technical capabilities, and featured GitHub repositories, heavily focused on the intersection of Code and Media.
- **Code Snippets Library** — A collection of reusable hooks, API helpers, middleware, and animated UI components with syntax highlighting and one-click copy.
- **Community & Messenger** — Authenticated community access and secure member-to-member messaging through a dedicated Express BFF.

## Features

### MDA AI Assistant (New!)
- Intelligent, context-aware responses powered by Gemini 3.1 Flash Lite.
- Real-time SSE streaming for ultra-fast chat experiences.
- Sleek, glassmorphism UI overlay (Floating Widget) with markdown and code block support.
- Deep integration with portfolio content and web search capabilities via Tavily API.

### Portfolio & Media
- Responsive cinematic landing page with dark, neon-accented aesthetics.
- Animated Hero and About sections using Framer Motion.
- GitHub profile and selected repositories integration.
- Dedicated showcase for Code, UI/UX, and Media projects.

### Code Snippets
- Reusable TypeScript, Express, React, and CSS examples.
- Compact code previews with syntax highlighting and line numbers.
- Dedicated snippet detail pages with copy status handling.

### Community and Messenger
- HttpOnly-cookie authentication through the Express BFF.
- Direct conversations with text messages, edit, recall, and delete-for-me actions.
- Cookie-authenticated WebSocket events with reconnect and REST resync.
- RLS-protected Supabase/PostgreSQL messaging data.

## Tech Stack

| Area | Technologies |
| --- | --- |
| **Frontend UI** | React 19, TypeScript, Vite |
| **AI Engine** | Google Gemini SDK, Server-Sent Events (SSE) |
| **Routing** | React Router |
| **Animation** | Framer Motion, Vanilla CSS Animations |
| **Code Highlighting**| React Syntax Highlighter |
| **Backend API** | Node.js, TypeScript, Express |
| **Database & Auth** | Supabase/PostgreSQL, HttpOnly cookies |
| **Workspace** | pnpm workspaces |

## Repository Structure

```text
zenith-workspace/
├── apps/
│   ├── api/                     # Express API & AI Controller
│   │   ├── src/
│   │   │   ├── controllers/     # AI Chat, Messages, Auth
│   │   │   ├── services/        # Gemini AI Service
│   │   │   └── server.ts
│   │   └── package.json
│   │
│   └── web/                     # React application
│       ├── src/
│       │   ├── app/             # App Router & Global Providers
│       │   ├── features/        # ai-chat, portfolio, community
│       │   ├── components/      # Shared UI
│       │   └── styles/          # Variables, CSS Modules
│       └── package.json
│
├── packages/                    # Future shared packages
├── package.json
└── pnpm-workspace.yaml
```

## Getting Started

### Requirements

- Node.js (v20+)
- pnpm (v11+)
- Git

### 1. Clone & Install

```bash
git clone https://github.com/SangTranTamLy/zenith-workspace.git
cd zenith-workspace
pnpm install
```

### 2. Configure Environment

Create `apps/api/.env` and add the following keys:

```env
# Database
DATABASE_URL="postgresql://...supabase.com:5432/postgres"

# AI Configuration
AI_MODEL_NAME="gemini-3.1-flash-lite"
EMBEDDING_MODEL="gemini-embedding-001"
OPENAI_API_KEY="AIzaSy..." # Your Gemini API Key here
WEB_SEARCH_API_KEY="tvly-..." # Your Tavily API Key here

# Server
NODE_ENV=development
PORT=4000
WEB_URL=http://localhost:5173
```

### 3. Start Development Servers

Run commands from the monorepo root:

```bash
# Start the API Backend (Port 4000)
pnpm --filter @zenith/api dev

# Start the Web Frontend (Port 5173)
pnpm --filter @zenith/web dev
```

## Styling Rules
Frontend styles strictly use **Vanilla CSS** (No Tailwind) to ensure maximum flexibility and mastery over the CSS cascade:
- Variables and design tokens are in `variables.css`.
- Animations in `animations.css`.
- Feature-specific CSS is isolated in feature modules (e.g., `ChatWidget.css`).

## Author

**T.Sang — SangTranTamLy**
- GitHub: [github.com/SangTranTamLy](https://github.com/SangTranTamLy)
- Email: [sangchaubr089@gmail.com](mailto:sangchaubr089@gmail.com)

---

*Built with React, TypeScript, Express, and intelligent AI integrations.*
