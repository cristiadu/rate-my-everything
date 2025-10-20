import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import { VitePluginNode } from 'vite-plugin-node'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/tests/setup.ts']
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@@/testutils': resolve(__dirname, './tests'),
    }
  },
  plugins: [
    tsconfigPaths(),
    ...VitePluginNode({
      adapter: 'express',
      appPath: './src/index.ts',
      exportName: 'app'
    })
  ]
})
