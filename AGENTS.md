# AGENTS.md

## Project Commands

- Use `pnpm` from the repository root for workspace tasks.
- Install dependencies with `pnpm install`.
- Run CI checks with `pnpm lint`, `pnpm test`, `pnpm build`, and `pnpm knip`.
- Upgrade dependencies with `pnpm upgrade-dependencies`; this project chooses latest available versions.
- API routes are tsoa-decorated controllers in `api/src/api/`. After changing routes or request and response types, run `pnpm openapi` to regenerate `api/openapi.yaml`, the API routes and the UI client.

## Code Style

- Follow the existing ESLint and TypeScript configuration.
- Use TypeScript path aliases when they are configured.
- Keep changes focused on the requested behavior.
- Do not commit secrets, `.env` files, credentials, or generated dependency folders.

## Tests

- Put reusable test setup in shared common files.
- Use the repository scripts instead of inventing one-off test commands.

## Local API Keys

- Copy `api/.env.example` to `api/.env` for local development and add the required API keys there.
- Keep real keys and credentials out of tracked files. The API reads `api/.env` in development and uses `api/.env.test` for tests.
