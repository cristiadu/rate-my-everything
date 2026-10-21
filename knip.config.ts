import type { KnipConfig } from 'knip'

/** Knip configuration for the api and ui workspaces. */
const config = {
  workspaces: {
    'api': {
      // tsoa generates the routes that use the controllers into the gitignored src/routes/generated/
      entry: ['src/routes/generated/routes.ts'],
      project: ['**/*.{ts,js}'],
    },
    'ui': {
      project: ['**/*.{ts,js,tsx,jsx}'],
    },
    '.': {
      project: ['./*.{ts,js}'],
    },
  },
} as const satisfies KnipConfig

export default config
