
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
- Importing interests from external services needs one API key per service. Without a key the API still starts, and imports from that service answer `503 SERVICE_UNAVAILABLE`.

| Variable | Default | Used for |
| --- | --- | --- |
| `LASTFM_API_KEY` | none | Importing all pages of a Last.fm user's most played artists and albums. Create a key at https://www.last.fm/api/account/create. |
| `YOUTUBE_API_KEY` | none | Importing a public YouTube video or every available video in a playlist. Create a key for the YouTube Data API v3 in the Google Cloud console. |

## Importing interests

Signed-in users open **Import interests** in the top menu, pick a source, and search:

| Source | What they type | What becomes an item |
| --- | --- | --- |
| Last.fm | A Last.fm username, e.g. `rj` | Every page of the user's all-time artists and albums, each labeled by type and with play counts and available images |
| YouTube | A video URL such as `https://youtu.be/dQw4w9WgXcQ` or a playlist URL | One video or every available playlist video, with its thumbnail; deleted and private playlist videos are skipped. Choose the destination category when importing. |

`GET /api/imports/:source?query=...` returns the found items without saving them. The UI then creates the selected ones in the chosen category through `POST /api/items`, and links each new item to its rating form.

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
