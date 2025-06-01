import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import path from 'path';
import { fileURLToPath } from 'url';

// Determine dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create compatibility layer to use legacy plugins
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

export default [
  // Global ESLint settings
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '.storybook/**',
      'storybook-static/**',
    ],
  },

  // Base settings for all files
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
  },

  // Apply JavaScript settings
  js.configs.recommended,
  
  // Use legacy configs through FlatCompat
  ...compat.extends('plugin:@typescript-eslint/recommended'),
  ...compat.extends('plugin:react/recommended'),
  ...compat.extends('plugin:storybook/recommended'),
  ...compat.extends('airbnb'),

  // Base rules for all files
  {
    files: ['**/*.{js,mjs,cjs,jsx,ts,tsx}'],
    rules: {
      'semi': ['error', 'never'],
      'max-len': ['error', {
        code: 140,
        tabWidth: 2,
      }],
    },
  },

  // Rules for UI React files
  {
    files: ['ui/**/*.{jsx,tsx}'],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
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
    },
  },

  // Rules for TypeScript files
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'error',
    },
  },

  // Rules for API TypeScript files
  {
    files: ['api/src/**/*.ts'],
    rules: {
      'import/extensions': ['error', 'never'],
    },
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.ts'],
        },
      },
    },
  },

  // Test file configurations
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

  // Storybook files
  {
    files: ['**/*.stories.@(js|jsx|ts|tsx)'],
    rules: {
      'import/no-extraneous-dependencies': 'off',
    },
  },
];
