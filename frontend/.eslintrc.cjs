// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

/** @type {import("eslint").Linter.Config} */
const config = {
  ignorePatterns: ['**/dist'],
  parserOptions: {
    ecmaVersion: 'latest',
    ecmaFeatures: {
      jsx: true
    }
  },
  env: {
    browser: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:prettier/recommended',
    'plugin:react-hooks/recommended'
  ],
  plugins: ['import', 'react-hooks', 'jsx-expressions', 'lodash'],
  settings: {
    react: {
      version: 'detect'
    }
  },
  rules: {
    'import/order': [
      'warn',
      {
        alphabetize: {
          order: 'asc'
        },
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index'
        ],
        'newlines-between': 'always'
      }
    ],
    'react/jsx-curly-brace-presence': ['error', 'never'],
    'react/prop-types': 'off',
    'react/self-closing-comp': [
      'error',
      {
        component: true,
        html: true
      }
    ],
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'no-console': [
      'error',
      {
        allow: ['warn', 'error']
      }
    ],
    'prefer-arrow-callback': [
      'error',
      {
        allowNamedFunctions: true
      }
    ],
    'arrow-body-style': ['error', 'as-needed']
  },
  overrides: [
    {
      files: '**/*.{ts,tsx}',
      extends: [
        'plugin:@typescript-eslint/recommended-type-checked',
        'plugin:@typescript-eslint/stylistic-type-checked'
      ],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: './tsconfig.eslint.json'
      },
      plugins: ['@typescript-eslint', 'react-hooks'],
      rules: {
        'jsx-expressions/strict-logical-expressions': 'error',
        '@typescript-eslint/no-misused-promises': [
          'error',
          {
            checksVoidReturn: false
          }
        ],
        '@typescript-eslint/no-unused-vars': [
          'warn',
          {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_'
          }
        ],
        '@typescript-eslint/consistent-type-definitions': 'off',
        '@typescript-eslint/prefer-nullish-coalescing': 'off',
        '@typescript-eslint/prefer-optional-chain': 'off',
        '@typescript-eslint/no-var-requires': 'off'
      }
    },
    {
      files: 'src/**/*.{js,jsx,ts,tsx}',
      rules: {
        'lodash/import-scope': ['error', 'method']
      }
    }
  ]
}

module.exports = config
