# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UIGen is an AI-powered React component generator with live preview. Users describe components in a chat interface and Claude generates them in a virtual file system with real-time preview.

## Commands

```bash
# Install dependencies, generate Prisma client, and run migrations
npm run setup

# Development server (uses Turbopack + node-compat polyfill)
npm run dev

# Build
npm run build

# Run all tests
npm test

# Run a single test file
npx vitest run src/components/chat/__tests__/ChatInterface.test.tsx

# Reset the SQLite database
npm run db:reset

# Regenerate Prisma client after schema changes
npx prisma generate

# Apply new migrations
npx prisma migrate dev
```

## Environment

Requires `ANTHROPIC_API_KEY` in `.env`. Without it, the app falls back to a `MockLanguageModel` that returns empty responses (see `src/lib/provider.ts`).

## Architecture

### Request Flow

1. User sends a message in `ChatInterface` → `ChatContext` → POST `/api/chat`
2. `/api/chat/route.ts` streams a Claude response using the Vercel AI SDK (`streamText`)
3. Claude uses two tools (`str_replace_editor`, `file_manager`) to create/edit files in the project
4. Tool calls update the virtual file system via `FileSystemContext`
5. The project (messages + serialized file system) is saved to the SQLite database after each response
6. `PreviewFrame` watches the file system and re-renders the component preview in a sandboxed iframe

### Key Abstractions

**Virtual File System** (`src/lib/file-system.ts`): All generated component files live in-memory only — nothing is written to disk. The `VirtualFileSystem` class manages CRUD for files and serializes to JSON for database persistence.

**JSX Transformation** (`src/lib/transform/jsx-transformer.ts`): Converts JSX/TSX files to browser-runnable JS using Babel Standalone and builds an import map so previews work without a bundler.

**AI Tools** (`src/lib/tools/`): `str_replace_editor` handles file creation and string-replace edits; `file_manager` handles rename/delete. These are the only ways Claude modifies files.

**Contexts**:
- `FileSystemContext` — holds the `VirtualFileSystem` instance and exposes file state to the whole tree
- `ChatContext` — manages message history and wires the Vercel AI SDK `useChat` hook to the `/api/chat` endpoint

### Authentication

JWT tokens in httpOnly cookies (7-day expiry). `src/middleware.ts` protects `/api/projects` and `/api/filesystem`. Anonymous users can generate components; their work is tracked in localStorage (`src/lib/anon-work-tracker.ts`) and can be claimed on sign-up.

### Database

Prisma ORM with SQLite (`prisma/dev.db`). Two models: `User` and `Project`. Projects store the full chat history and virtual file system as JSON strings in `messages` and `data` columns.

### Path Aliases

`@/*` maps to `src/*` (configured in `tsconfig.json`). Generated components use `@/` for cross-file imports within the virtual file system.

### UI Layout

`src/app/main-content.tsx` is the top-level layout: a three-panel resizable layout with chat on the left and a Preview/Code toggle on the right. The code view splits into a `FileTree` and Monaco `CodeEditor`.

## Code Style

Use comments sparingly. Only comment complex code.

## Testing

Tests use Vitest + jsdom + React Testing Library. Test files live in `__tests__/` subdirectories alongside the components they test.
