
# Rate My Everything

Web-based application for rating items/interests based on individual user reviews. Focuses on personal ratings rather than collective scores.

[![Project's CI](https://github.com/cristiadu/rate-my-everything/actions/workflows/ci.yml/badge.svg)](https://github.com/cristiadu/rate-my-everything/actions/workflows/ci.yml)
[![CodeQL](https://github.com/cristiadu/rate-my-everything/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/cristiadu/rate-my-everything/actions/workflows/codeql-analysis.yml)

## Project Structure

This is a monorepo with two main apps:
- `ui/`: React frontend (TypeScript, Vite, Webpack)
- `api/`: Node.js backend (TypeScript, Vite, REST API)

## Package Manager & Scripts

- Install dependencies: `pnpm install` (from root)
- Start all apps: `pnpm start` (runs both UI and API)
- Start only API: `pnpm --filter api dev`
- Start only UI: `pnpm --filter ui start`
- Build UI: `pnpm --filter ui build`
- Test: `pnpm test` (runs tests in both apps)
- Lint: `pnpm lint` or `pnpm lint:fix`
- Upgrade dependencies: `pnpm upgrade-dependencies`
- Analyze unused code: `pnpm knip` or `pnpm knip:fix`
- Clean: `pnpm clean` (removes all `node_modules` and `dist` folders)

## Environment Variables

- Both UI and API require environment variables. See below for details.
- API requires `JWT_SECRET` for authentication (e.g., `JWT_SECRET=my-dev-secret`).

## UI (Frontend)

- **Tech stack:** React, TypeScript, Vite, Webpack
- **Component organization:** Feature-based folders (`users/`, `rankings/`, `layout/`, `filters/`, `health/`)
- **API calls:** Use `src/config/ApiService.ts` and `ApiConfig.ts` for backend communication
- **Auth:** Managed via `src/components/users/AuthContext.tsx`
- **Testing:** React Testing Library; tests in `src/components/tests/`

## API (Backend)

- **Tech stack:** Node.js, TypeScript, Vite
- **Controllers:** REST endpoints in `src/api/*Controller.ts`
- **Services:** Business logic in `src/services/`
- **Models:** Shared types in `src/models/`
- **Routing/Auth:** Config in `src/routes/`
- **Error handling:** Use `APIError.ts` in controllers
- **Testing:** Vitest; integration tests in `src/tests/integration/`

## Integration & Patterns

- API endpoints defined in `api/src/api/*Controller.ts`
- Frontend API calls abstracted in `ui/src/config/ApiService.ts`
- Authentication managed via frontend context and backend controller
- Linting and code analysis required before merging (see CI/CD)
