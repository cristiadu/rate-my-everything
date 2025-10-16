import { defineConfig } from 'vite';
import { VitePluginNode } from 'vite-plugin-node';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['reflect-metadata'],
  },
  build: {
    outDir: 'dist',
    target: 'node18',
    minify: false,
    sourcemap: true,
    // Use esbuild options to preserve decorators
    lib: {
      entry: 'src/index.ts',
      formats: ['cjs']
    },
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
      },
      // Externalize dependencies to avoid bundling issues
      external: ['typeorm', 'pg', 'bcrypt', 'jsonwebtoken', 'express', /node:.*/],
    },

  },
  plugins: [
    ...VitePluginNode({
      adapter: 'express',
      appPath: './src/index.ts',
      exportName: 'app', // Not used here but required by the plugin
    }),
  ],
});