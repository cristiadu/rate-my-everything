# AGENTS.md

## Project Commands

- Use `pnpm` from the repository root for workspace tasks.
- Install dependencies with `pnpm install`.
- Run CI checks with `pnpm lint`, `pnpm test`, `pnpm build`, and `pnpm knip`.
- Upgrade dependencies with `pnpm upgrade-dependencies`; this project chooses latest available versions.

## Code Style

- Follow the existing ESLint and TypeScript configuration.
- Use TypeScript path aliases when they are configured.
- Keep changes focused on the requested behavior.
- Do not commit secrets, `.env` files, credentials, or generated dependency folders.

## Tests

- Put reusable test setup in shared common files.
- Use the repository scripts instead of inventing one-off test commands.
