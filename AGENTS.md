# Repository Guidelines

## Project Structure & Module Organization
`src/` contains the React + TypeScript frontend.
- `src/components/` holds feature components; `src/components/ui/` stores shared shadcn/ui primitives.
- `src/api/household.ts` contains API client logic.
- `src/hooks/`, `src/utils/`, `src/types/`, and `src/constants/` contain reusable logic, domain types, and shared constants.

Backend-related code lives outside `src/`:
- `worker/index.ts`: Cloudflare Worker (`/api/*` proxy + auth).
- `gas/Code.gs`: Google Apps Script for Spreadsheet read/write.
- `public/`: static assets, `docs/`: setup/architecture/API docs.
- `dist/` and `dev-dist/` are generated outputs; do not edit directly.

## Build, Test, and Development Commands
- `pnpm install`: install dependencies.
- `pnpm dev`: start local dev server (served via Vite/Cloudflare plugin).
- `pnpm build`: run TypeScript project build then Vite production build.
- `pnpm preview`: build and preview the production bundle locally.
- `pnpm lint`: run ESLint on the repo.
- `pnpm test`, `pnpm test:watch`, `pnpm test:coverage`: run Vitest in normal/watch/coverage mode.
- `pnpm deploy`: build then deploy to Cloudflare Workers.
- `pnpm cf-typegen`: regenerate Worker type definitions after env/binding changes.

## Coding Style & Naming Conventions
Use strict TypeScript and keep lint warnings at zero.
- Components/types: `PascalCase`; hooks: `useXxx`; helpers/constants: `camelCase`.
- Co-locate tests next to source files (example: `src/utils/format.ts` and `src/utils/format.test.ts`).
- Prefer `@/` imports for `src` paths when it improves readability.
- Match the existing style in touched files (quotes/spacing) and avoid unrelated formatting churn.

## Testing Guidelines
Vitest is configured in `vite.config.ts` (`environment: "node"` with V8 coverage reporters).
- Add or update tests for every behavior change, especially in `src/utils/` and API/Worker logic.
- Run `pnpm test:coverage` for non-trivial changes to catch regressions early.

## Commit & Pull Request Guidelines
Recent history uses concise Conventional Commit-style prefixes like `feat:` and `fix:` (English or Japanese summary text is both used). Branch names commonly follow `feature/...` or `fix/...`.
- Keep commits focused and imperative (avoid broad “WIP” commits in shared history).
- PRs should include: purpose, key changes, verification commands (`pnpm lint && pnpm test && pnpm build`), linked issue, and screenshots for UI/chart updates.

## Security & Configuration Tips
- Never commit `.dev.vars` or secrets; use `.dev.vars.example` as the template.
- Set production secrets via Wrangler (example: `wrangler secret put BASIC_AUTH_USERS`).
