
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
- Regenerate the OpenAPI spec and the UI API client: `pnpm openapi`
- Clean: `pnpm clean` (removes all `node_modules` and `dist` folders)

## Environment Variables

- Both UI and API require environment variables. See below for details.
- API requires `JWT_SECRET` for authentication (e.g., `JWT_SECRET=my-dev-secret`).
- Importing interests from external services needs one API key per service. Without a key the API still starts, and imports from that service answer `503 SERVICE_UNAVAILABLE`.
- For local API development, copy `api/.env.example` to `api/.env` and set the values. The API loads `api/.env`; that local file is ignored by Git. For deployments, provide the same variables through the process environment.

| Variable | Default | Used for |
| --- | --- | --- |
| `LASTFM_API_KEY` | none | Importing all pages of a Last.fm user's most played artists and albums. Create a key at https://www.last.fm/api/account/create. |
| `YOUTUBE_API_KEY` | none | Importing a public YouTube video or every available video in a playlist. Create a key for the YouTube Data API v3 in the Google Cloud console. |
| `SEED_BOOTSTRAP_DATA` | `false` | When `true`, every start creates the bootstrap admin and the starter categories (Movies, Music, Books, Games, Restaurants) with their attributes. Rows that already exist are kept, so it is safe to leave on. |
| `BOOTSTRAP_ADMIN_USERNAME`, `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD` | none | The bootstrap admin's login. Required when `SEED_BOOTSTRAP_DATA` is `true`; the API refuses to start without them. `api/.env.example` has local development values. |
| `SMTP_HOST` | none | SMTP server that sends password reset emails. Without it the API sends no email and only logs that a reset was asked for. |
| `SMTP_PORT` | none | SMTP port; `465` uses TLS from the start and any other port, like `587`, upgrades with STARTTLS. Required with `SMTP_HOST`. |
| `SMTP_USER`, `SMTP_PASSWORD` | none | SMTP login, for servers that ask for one. |
| `SMTP_FROM` | none | Sender of the emails, e.g. `Rate My Everything <noreply@ramyev.alwaysdata.net>`. Required with `SMTP_HOST`. |
| `APP_URL` | none | Public address of the UI, e.g. `https://ramyev.alwaysdata.net`; reset links open its `/reset-password` page. Required with `SMTP_HOST`; the API refuses to start when one of these three is missing. |
| `PORT` | `3000` | Port the API listens on. |
| `IP` | every address | Address the API listens on; alwaysdata sets it for its Node.js sites. |
| `UI_DIST_DIR` | none | Folder of the built UI. When set, the API serves the UI next to `/api` and answers every other path with its `index.html`; locally, webpack serves the UI instead. |

## Deployment

The app runs on the free [alwaysdata](https://www.alwaysdata.com/en/offers/) plan (no card, 1 GB disk, 256 MB RAM, personal use), with the API serving the UI from one Node.js site at `https://<account>.alwaysdata.net`. The production UI build calls the API on the same site's `/api`.

The **Deploy to alwaysdata** workflow runs on each push to `main`: it builds both apps, copies the API with its production dependencies and the UI to `~/rate-my-everything/` over SSH, then restarts the site through the alwaysdata API. It is skipped while the `ALWAYSDATA_ACCOUNT` variable is unset.

One-time setup in the alwaysdata panel:

| Where | Setting |
| --- | --- |
| Databases > PostgreSQL | A database and user; enable the `pg_trgm` and `unaccent` extensions on it |
| Web > Sites | A Node.js site on `<account>.alwaysdata.net`, command `node dist/index.js`, working directory `rate-my-everything/api`, idle time `0` |
| Site environment | `JWT_SECRET` (a long random value; logins fail while it is empty), `PGHOST=postgresql-<account>.alwaysdata.net`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, `UI_DIST_DIR=../ui`. Optionally `SEED_BOOTSTRAP_DATA=true` together with all three of `BOOTSTRAP_ADMIN_USERNAME`, `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` for the first admin (the API refuses to start if one is missing), and `LASTFM_API_KEY` and `YOUTUBE_API_KEY` |
| Emails > Addresses | A mailbox to send password reset emails from, e.g. `noreply@<account>.alwaysdata.net` |
| Site environment, for email | `SMTP_HOST=smtp-<account>.alwaysdata.net`, `SMTP_PORT=587`, `SMTP_FROM="Rate My Everything <noreply@<account>.alwaysdata.net>"` and `APP_URL=https://<account>.alwaysdata.net`; no `SMTP_USER` or `SMTP_PASSWORD`, since alwaysdata's SMTP server needs no login from the sites it hosts |
| Remote access > SSH | Password login on for the account's SSH user |
| Profile > Tokens | An API token |

Then in the GitHub repository settings, add the variables `ALWAYSDATA_ACCOUNT` (account name) and `ALWAYSDATA_SITE_ID` (the number in the site's panel URL), and the secrets `ALWAYSDATA_PASSWORD` (SSH password) and `ALWAYSDATA_API_TOKEN`.

## Importing interests

Signed-in users open **Import interests** in the top menu, pick a source, and search:

| Source | What they type | What becomes an item |
| --- | --- | --- |
| Last.fm | A Last.fm username, e.g. `rj` | Every page of the user's all-time artists and albums, each labeled by type and with play counts and available images |
| YouTube | A video URL such as `https://youtu.be/dQw4w9WgXcQ` or a playlist URL | One video or every available playlist video, with its channel, source description, and thumbnail; deleted and private playlist videos are skipped. Choose the destination category when importing. |

`GET /api/imports/:source?query=...` returns the found items without saving them. The UI then creates the selected ones in the chosen category through `POST /api/items`, and links each new item to its rating form.

## UI (Frontend)

- **Tech stack:** React, TypeScript, Vite, Webpack
- **Component organization:** Feature-based folders (`users/`, `rankings/`, `layout/`, `filters/`, `health/`)
- **API calls:** Use the functions and types of `src/api/generated/api.ts`, generated by [Orval](https://orval.dev) from `api/openapi.yaml` on `pnpm install` and `pnpm openapi`; they send requests through `src/api/apiFetch.ts`
- **Auth:** Managed via `src/components/users/AuthContext.tsx`
- **Testing:** React Testing Library; tests in `src/components/tests/`

## API (Backend)

- **Tech stack:** Node.js, TypeScript, Vite
- **Controllers:** REST endpoints in `src/api/*Controller.ts`
- **Services:** Business logic in `src/services/`
- **Models:** Shared types in `src/models/`
- **Routing/Auth:** Config in `src/routes/`
- **OpenAPI:** controllers in `src/api/` use [tsoa](https://tsoa-community.github.io/docs/) decorators (`@Route`, `@Get`, `@Body`, `@Security`...) on the request and response types in `src/models/`; `pnpm openapi` (also run on `pnpm install`) generates `openapi.yaml` and the Express routes in `src/routes/generated/` from them, configured in `tsoa.json`
- **Error handling:** Controllers throw `RequestRejected` with an `APIError`, and document each error with `@Response` and the shared descriptions and examples in `src/api/ApiDocumentation.ts` (with the rate limit headers on 429); ids in paths and bodies use the `ResourceId` type from `src/models/ResourceId.ts`
- **Schema names:** request and response types are named interfaces (`ItemResponse`, `ItemInput`, `RatingUpdate`...), and their fields carry `@example`, `@isInt` and similar JSDoc tags, so the spec shows readable names and examples; the UI uses these generated types directly
- **Testing:** Vitest; integration tests in `src/tests/integration/`

## Integration & Patterns

- API endpoints defined in `api/src/api/*Controller.ts`
- The API contract is `api/openapi.yaml` (OpenAPI 3.1), generated from the decorated controllers, so a route cannot exist without being documented. tsoa validates request bodies, paths and queries against it, and the "Publish OpenAPI spec" workflow regenerates it on each pull request that changes the API and commits it onto that pull request's branch
- Frontend API calls use the client generated from that spec
- Authentication managed via frontend context and backend controller
- Linting and code analysis required before merging (see CI/CD)
