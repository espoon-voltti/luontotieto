// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

/** @type {import("eslint").Linter.Config} */
const config = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    project: './tsconfig.json',
    ecmaFeatures: {
      modules: true
    }
  },
  ignorePatterns: ['*.js', 'dist'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/stylistic',
    'plugin:prettier/recommended'
  ],
  plugins: ['@typescript-eslint'],
  rules: {
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
  }
}

module.exports = config
