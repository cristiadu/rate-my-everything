import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'
import path from 'path'
import { fileURLToPath } from 'url'

// Import plugins using ES modules
import importPlugin from 'eslint-plugin-import'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y'
import typescriptPlugin from '@typescript-eslint/eslint-plugin'

// Determine dirname in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Create compatibility layer to use legacy plugins
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  plugins: {
    // Define all plugins here so they can be used throughout the config
    import: importPlugin,
    react: reactPlugin,
    'react-hooks': reactHooksPlugin,
    'jsx-a11y': jsxA11yPlugin,
    '@typescript-eslint': typescriptPlugin,
  },
})

export default [
  // ===========================
  // ROOT CONFIGURATION - Shared settings for all modules
  // ===========================
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
    ],
  },
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
  },
  js.configs.recommended,
  ...compat.extends('plugin:@typescript-eslint/recommended'),
  {
    files: ['**/*.{js,mjs,cjs,jsx,ts,tsx}'],
    rules: {
      semi: ['error', 'never'],
      'max-len': ['error', {
        code: 140,
        tabWidth: 2,
      }],
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'error',
    },
  },
  {
    files: [
      '**/*.test.{js,jsx,ts,tsx}',
      '**/__tests__/**/*.{js,jsx,ts,tsx}',
    ],
    languageOptions: {
      globals: {
        jest: true,
        expect: true,
        describe: true,
        it: true,
        beforeEach: true,
        afterEach: true,
      },
    },
  },

  // ===========================
  // UI MODULE CONFIGURATION
  // ===========================
  {
    settings: {
      react: {
        version: '19.1.0',
      },
    },
  },
  ...compat.extends('plugin:react/recommended'),
  {
    files: ['ui/**/*.{jsx,tsx}'],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      import: importPlugin,
      react: reactPlugin
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: './ui/tsconfig.json',
          alwaysTryTypes: true,
        },
        node: true,
      },
    },
    rules: {
      'react/jsx-props-no-spreading': ['off'],
      'react/function-component-definition': [
        'error',
        {
          namedComponents: 'arrow-function',
          unnamedComponents: 'arrow-function',
        },
      ],
      'react/jsx-filename-extension': [
        'error',
        {
          extensions: ['.jsx', '.tsx'],
        },
      ],
      'import/extensions': [
        'error',
        'never',
        {
          css: 'always',
          svg: 'always',
          stories: 'always',
        },
      ],
      'import/no-unresolved': 'error',
    },
  },
  {
    files: ['**/*.stories.@(js|jsx|ts|tsx)'],
    plugins: {
      import: importPlugin
    },
    rules: {
      'import/no-extraneous-dependencies': 'off',
      'react/prop-types': 'off',
    },
  },

  // ===========================
  // API MODULE CONFIGURATION
  // ===========================
  {
    files: ['api/src/**/*.ts'],
    plugins: {
      import: importPlugin
    },
    rules: {
      'import/extensions': ['error', 'never'],
      'import/no-unresolved': 'error',
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: './api/tsconfig.json',
          alwaysTryTypes: true,
        },
        node: {
          extensions: ['.js', '.ts'],
        },
        alias: {
          map: [
            ['@', './api/src']
          ],
          extensions: ['.ts', '.js', '.json']
        }
      },
    },
  },
]
