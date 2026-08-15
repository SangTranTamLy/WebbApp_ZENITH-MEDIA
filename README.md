# Zenith Media Workspace

Personal portfolio and reusable code snippets library built by [T.Sang](https://github.com/SangTranTamLy).

Zenith combines product development, technical writing, and visual storytelling in one web experience. The project is designed to showcase real development work, document engineering decisions, and share practical React, TypeScript, Express, and CSS solutions.

> Planned domain: [zenith.io.vn](https://zenith.io.vn)

## Overview

Zenith currently focuses on two areas:

- **Developer portfolio** — personal introduction, technical capabilities, and featured GitHub projects.
- **Code snippets** — reusable hooks, API helpers, middleware, and animated UI components with syntax highlighting and one-click copy.

## Features

### Portfolio

- Responsive cinematic landing page
- Animated Hero and About sections
- GitHub profile and selected repositories
- Technical skills and service overview
- Accessible contact links
- Reduced-motion support

### Code Snippets

- Reusable TypeScript, Express, React, and CSS examples
- Compact code previews
- Dedicated snippet detail pages
- Syntax highlighting and line numbers
- Copy status and clipboard error handling

## Tech Stack

| Area | Technologies |
| --- | --- |
| Frontend | React, TypeScript, Vite |
| Routing | React Router |
| Server state | TanStack Query |
| Forms and validation | React Hook Form, Zod |
| Animation | Framer Motion, CSS animations |
| Code highlighting | React Syntax Highlighter |
| Backend | Node.js, TypeScript, Express |
| API security | Helmet, CORS |
| Package management | pnpm workspaces |

## Repository Structure

```text
zenith-workspace/
├── apps/
│   ├── api/                     # Express API
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                     # React application
│       ├── public/
│       ├── src/
│       │   ├── app/             # App, providers, and router
│       │   ├── assets/          # Images and static assets
│       │   ├── components/      # Shared layout and UI components
│       │   ├── content/         # Snippets and shared content
│       │   ├── features/        # Feature-specific components
│       │   ├── pages/           # Route pages
│       │   ├── services/        # HTTP and API services
│       │   └── styles/          # Variables, global CSS, portfolio CSS, animations
│       └── package.json
│
├── packages/                    # Future shared packages
├── package.json
├── pnpm-lock.yaml
└── pnpm-workspace.yaml
```

## Getting Started

### Requirements

- Node.js
- pnpm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/SangTranTamLy/zenith-workspace.git
cd zenith-workspace
```

If your repository uses a different name, replace the URL and folder name above.

### 2. Install dependencies

Run this command from the monorepo root:

```bash
pnpm install
```

### 3. Configure the API

Create `apps/api/.env`:

```env
NODE_ENV=development
PORT=4000
CORS_ORIGIN=http://localhost:5173
```

Do not commit `.env` files or production secrets.

### 4. Start the backend

From the monorepo root:

```bash
pnpm --filter @zenith/api dev
```

Health endpoint:

```text
http://localhost:4000/api/health
```

### 5. Start the frontend

Open another terminal at the monorepo root:

```bash
pnpm --filter @zenith/web dev
```

Frontend:

```text
http://localhost:5173
```

## Available Routes

| Route | Purpose |
| --- | --- |
| `/` | Portfolio homepage |
| `/snippets` | Code snippets library |
| `/snippets/:slug` | Snippet detail |

## Development Commands

Run commands from the monorepo root:

```bash
# Start the web application
pnpm --filter @zenith/web dev

# Start the API
pnpm --filter @zenith/api dev

# Type-check the frontend
pnpm --filter @zenith/web exec tsc -b

# Build the frontend
pnpm --filter @zenith/web build
```

## Styling Rules

Frontend styles are separated by responsibility:

```text
apps/web/src/styles/
├── variables.css      # Design tokens and CSS variables
├── animations.css     # CSS @keyframes only
├── portfolio.css      # Portfolio and snippets UI
└── globals.css        # Imports, reset, and global styles
```

Import order in `globals.css`:

```css
@import "./variables.css";
@import "./animations.css";
@import "./portfolio.css";
```

Framer Motion configuration remains inside React components. CSS `@keyframes` belong in `animations.css`.

## Security Principles

The project follows these baseline rules:

- Secrets are stored in environment variables.
- API input is validated before business logic runs.
- Helmet and explicit CORS rules protect the Express API.
- User-generated content must be sanitized before rendering.
- Rate limiting will protect public write endpoints.
- Authentication and permissions must be enforced by the backend.
- Production logging must not expose credentials or private user data.

## Roadmap

- [ ] Snippet language filters
- [ ] Reaction and view counters
- [ ] OpenAPI documentation for the Express API
- [ ] Rate limiting and request auditing
- [ ] Automated testing
- [ ] GitHub Actions CI/CD
- [ ] Production deployment for `zenith.io.vn`
- [ ] Error tracking and observability

## Featured Projects

- [QuickServe POS](https://github.com/SangTranTamLy/pos-system-online)
- [Study ELS](https://github.com/SangTranTamLy/Study-ELS)
- [Study DEV](https://github.com/SangTranTamLy/Study-DEV)

## Author

**T.Sang — SangTranTamLy**

- GitHub: [github.com/SangTranTamLy](https://github.com/SangTranTamLy)
- Email: [sangchaubr089@gmail.com](mailto:sangchaubr089@gmail.com)

---

Built with React, TypeScript, Express, and a focus on clear engineering and thoughtful interaction.
