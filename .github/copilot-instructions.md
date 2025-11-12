
# Copilot Instructions for AI Coding Agents

## Project Structure
This monorepo contains two distinct apps:
- **ui/**: React frontend (TypeScript, Vite, Webpack)
- **api/**: Node.js backend (TypeScript, Vite, REST API)

---

## UI (Frontend) Guidelines

- **Tech stack:** React, TypeScript, Vite, Webpack
- **Component organization:**
  - Feature-based folders: `users/`, `rankings/`, `layout/`, `filters/`, `health/`
  - Shared types: `components/types.ts`
- **API communication:**
  - Use `ApiService.ts` and config from `ApiConfig.ts` for all backend calls
  - Auth context in `users/AuthContext.tsx` manages login state
- **Testing:**
  - Use React Testing Library; tests in `components/tests/`
- **Build & dev:**
  - Install: `pnpm install` (from root)
  - Start: `pnpm start` (from `ui/`)
  - Build: `pnpm build` (from `ui/`)
  - Lint: `pnpm lint` or `pnpm lint:fix`
  - Analyze unused code: `pnpm knip`
  - Always use `pnpm` for all package management and scripts—never use `npm` or other package managers
- **Patterns:**
  - Use context for authentication and global state
  - API calls are abstracted; do not call backend directly from components
  - Organize new features by creating a folder in `components/` and updating API service/config as needed
- **Environment:**
  - Requires environment variables; see `.env.example` if present

---

## API (Backend) Guidelines

- **Tech stack:** Node.js, TypeScript, Vite
- **Architecture:**
  - REST controllers in `src/api/*Controller.ts` handle HTTP requests
  - Business logic in stateless services under `src/services/`
  - Data models in `src/models/`
  - Routing and auth config in `src/routes/`
- **Patterns:**
  - Controllers delegate to services; do not include DB logic in controllers
  - Use `APIError.ts` for error handling in controllers
  - Models are shared between controllers and services
- **Testing:**
  - Use Vitest; integration tests in `src/tests/integration/`
- **Build & dev:**
  - Install: `pnpm install` (from root)
  - Start: `pnpm dev` (from `api/`)
  - Test: `pnpm test` (from `api/`)
  - Lint: `pnpm lint` or `pnpm lint:fix`
  - Upgrade deps: `pnpm upgrade-dependencies`
  - Analyze unused code: `pnpm knip`
  - Always use `pnpm` for all package management and scripts—never use `npm` or other package managers
- **Environment:**
  - Requires environment variables; see `.env.example` if present

---

## Integration & Cross-App Patterns

- **API endpoints:** Defined in `api/src/api/*Controller.ts`
- **Frontend API calls:** Use `ui/src/config/ApiService.ts` and `ApiConfig.ts`
- **Authentication:** Managed via frontend `AuthContext.tsx` and backend `LoginController.ts`
- **CI/CD:** GitHub Actions for CI (`.github/workflows/ci.yml`), CodeQL analysis
- **Quality:** Linting and code analysis required before merging

---


---

## Monorepo & Main package.json

- The root `package.json` uses **pnpm workspaces** to manage `api` and `ui` as subprojects.
- **Scripts** in the root run commands in parallel across both apps using `pnpm --parallel -r <script>`:
  - `start`, `build`, `deploy`, `release`, `test` run in both apps
  - `lint` and `lint:fix` run ESLint across the whole repo
  - `upgrade-dependencies` updates all dependencies in all workspaces
  - `knip` and `knip:fix` analyze and fix unused code using `knip.config.ts`
- **Clean script**: `pnpm clean` removes all `node_modules` and `dist` folders recursively
- **Dev dependencies**: ESLint, TypeScript, Knip, and related plugins are managed at the root for consistency
- **Type:** The repo uses `type: module` for ES module syntax
- **Conventions:**
  - Always run installs and upgrades from the root
  - Use workspace scripts for consistent builds, tests, and linting
  - Prefer updating dependencies via the root script for all packages
  - Always use `pnpm` for all package management and scripts—never use `npm` or other package managers

---
For questions or missing conventions, check `README.md` or ask for clarification.
