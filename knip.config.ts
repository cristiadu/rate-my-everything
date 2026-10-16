import type { KnipConfig } from 'knip'

// Knip configuration for monorepo with Next.js, React Router v7, and shared packages
const config = {
  tags: ['knipignore'],
  workspaces: {
    'api': {
      project: ['**/*.{ts,js}'],
      ignoreBinaries: ["sleep"],
      // Imported by the routes tsoa generates into the gitignored src/routes/generated/
      ignoreDependencies: ['@tsoa/runtime'],
    },
    'ui': {
      project: ['**/*.{ts,js,tsx,jsx}'],
      ignoreFiles: ['**/users/AuthPage.tsx', '**/users/LoginForm.tsx', '**/users/RegisterForm.tsx'],
    },
    '.': {
      project: ['./*.{ts,js}'],
      ignoreDependencies: [],
    },
  },
  ignore: [
    '**/public/**',
    '**/dist/**',
    '**/.next/**',
    '**/node_modules/**',
    '**/.turbo/**',
  ],
} as const satisfies KnipConfig

export default config