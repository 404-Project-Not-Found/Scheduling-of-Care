<!-- .github/copilot-instructions.md - Guidance for AI coding agents working in this repo -->

This repository is a Next.js application (app-router) implemented in TypeScript with Mongoose models and Jest tests. The instructions below highlight project structure, conventions, key integration points, and exact commands to run locally so an AI agent can be productive immediately.

- Big picture
  - Root Next app using the app router: primary UI lives under `src/app` and UI primitives/components in `src/components`.
  - Domain helpers and infra utilities are in `src/lib` (DB connection, uploads, helpers). Mongoose models live in `src/models`.
  - React Context providers are under `src/context` (e.g. `ActiveClientContext.tsx`, `TaskContext.tsx`). Use these rather than adding global singletons.

- Key files & folders to read first
  - `src/app` — route entry points and layout. Look for server vs client components (`'use client'` at top signals client components).
  - `src/components` — reusable UI and small widgets (search here for behaviour patterns like portals, print, details/summary blocks).
  - `src/lib/mongodb.ts` and `src/lib/image-upload.ts` — DB and upload integration examples.
  - `src/models/*.ts` — Mongoose schemas; follow these patterns when adding new collections.
  - `tests/` and `tests/set_up/db.ts` — how unit tests spin up an in-memory MongoDB (mongodb-memory-server) and use `ts-jest`.
  - `package.json` — contains authoritative scripts (dev/build/test/lint/format). Use them, not ad-hoc commands.
  - `.github/workflows/ci.yml` — CI expects possible monorepo layouts (checks for `frontend` and `backend` subfolders). This repo uses root `package.json`, CI may skip parts unless subfolders are present.

- Important conventions & patterns
  - TypeScript + React (Next 15). Prefer typed exports and small component props. Keep server-only code out of files that have `'use client'` at top.
  - Client components must include `'use client'` at the top of the file (see `src/components/help/HelpPanel.tsx` example).
  - Data access is via Mongoose models in `src/models`; helper methods live in `src/lib/*-helpers.ts`.
  - Tests are Jest-based with `--runInBand` in `package.json`. Use `tests/set_up/db.ts` fixture to reuse the in-memory MongoDB behavior.
  - Formatting & linting: Prettier + ESLint. Husky + lint-staged is configured; prefer `npm run format` and `npm run lint` for automated fixes.

- Exact commands (run from repo root)
  - dev: `npm run dev` (uses `next dev --turbopack`)
  - build: `npm run build` (uses `next build --turbopack`)
  - start: `npm run start`
  - lint: `npm run lint`; autofix: `npm run lint:fix`
  - format: `npm run format`
  - tests: `npm run test` (invokes `jest --runInBand`)

- Integration & external deps to watch
  - MongoDB via `mongoose` (see `src/lib/mongodb.ts` and `src/models/*`). Tests use `mongodb-memory-server`.
  - Authentication: `next-auth` / `@auth/*` adapters and API helpers live in `src/app/api/auth`.
  - Email: `nodemailer` and `resend` used in `src/lib/email.ts`.
  - FullCalendar: heavy client-side calendar usage under `src/components/calendar` and `src/app/calendar_dashboard`.

- Examples / idioms to copy
  - Portal + overlay pattern: `src/components/help/HelpPanel.tsx` uses `createPortal`, overlay/backdrop, and client-only print button: `onClick={() => typeof window !== 'undefined' && window.print()}`.
  - Q/A parsing: `parseQAPairs` in the same file demonstrates parsing multi-line content into structured Q/A pairs — follow similar small-pure functions for text parsing.

- When changing tests or DB code
  - Reuse `tests/set_up/db.ts` setup patterns; Jest + ts-jest is standard. Keep tests fast by leveraging the in-memory server.

If anything above is unclear or you need more specific instructions (e.g., the preferred way to add a new API route or how to wire a new model into the seed/setup), tell me which area to expand and I'll iterate the doc.
