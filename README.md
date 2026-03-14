# UIGen

AI-powered React component generator with live preview. Describe a component in the chat and Claude generates it instantly in a sandboxed preview — no files written to disk.

## Prerequisites

- Node.js 18+
- npm
- Anthropic API key (optional — falls back to a mock model without it)

## Setup

1. Copy `.env.example` to `.env` and add your API key:

```
ANTHROPIC_API_KEY=your-api-key-here
```

2. Install dependencies and initialize the database:

```bash
npm run setup
```

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage

1. Sign up or continue as an anonymous user
2. Describe the React component you want in the chat
3. Watch the live preview update in real time
4. Switch to Code view to browse and edit generated files
5. Keep iterating with the AI to refine your component

## Commands

| Command | Description |
|---|---|
| `npm run setup` | Install deps, generate Prisma client, run migrations |
| `npm run dev` | Start development server (Turbopack) |
| `npm run build` | Production build |
| `npm test` | Run all tests |
| `npm run db:reset` | Reset the SQLite database |
| `npx prisma generate` | Regenerate Prisma client after schema changes |
| `npx prisma migrate dev` | Apply new migrations |

## Architecture

### Request Flow

1. User sends a message → `ChatContext` → POST `/api/chat`
2. Claude streams a response via the Vercel AI SDK (`streamText`)
3. Claude uses two tools (`str_replace_editor`, `file_manager`) to create/edit files
4. Tool calls update the in-memory virtual file system
5. Project (messages + file system) is persisted to SQLite after each response
6. `PreviewFrame` re-renders the component preview in a sandboxed iframe

### Key Abstractions

- **Virtual File System** (`src/lib/file-system.ts`) — all generated files are in-memory only; serialized to JSON for database persistence
- **JSX Transformation** (`src/lib/transform/jsx-transformer.ts`) — converts JSX/TSX to browser-runnable JS using Babel Standalone with an import map (no bundler needed)
- **AI Tools** (`src/lib/tools/`) — `str_replace_editor` for file creation/edits, `file_manager` for rename/delete
- **Authentication** — JWT in httpOnly cookies (7-day expiry); anonymous work tracked in localStorage and claimable on sign-up

## Tech Stack

- Next.js 15 (App Router) + React 19
- TypeScript + Tailwind CSS v4
- Prisma + SQLite
- Anthropic Claude + Vercel AI SDK
- Monaco Editor
- Vitest + React Testing Library
