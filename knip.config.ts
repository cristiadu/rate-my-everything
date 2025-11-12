import type { KnipConfig } from 'knip'

// Knip configuration for monorepo with Next.js, React Router v7, and shared packages
const config = {
  tags: ['knipignore'],
  workspaces: {
    'api': {
      project: ['**/*.{ts,js}'],
    },
    'ui': {
      project: ['**/*.{ts,js,tsx,jsx}'],
      ignoreFiles: ['**/users/AuthPage.tsx', '**/users/LoginForm.tsx', '**/users/RegisterForm.tsx', '**/config/ApiService.ts'],
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