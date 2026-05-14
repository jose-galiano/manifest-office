// Maelify framework — universal slice for public storefront context.
// Enforces: zero `any`, explicit boundaries, descriptive names, SonarQube hygiene,
// unused-import cleanup, import ordering. Polaris / Prisma / RLS rules are out
// of scope for this repo (see docs/architecture.md).

import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FlatCompat } from '@eslint/eslintrc';
import { defineConfig, globalIgnores } from 'eslint/config';
import sonarjs from 'eslint-plugin-sonarjs';
import unusedImports from 'eslint-plugin-unused-imports';

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = defineConfig([
  // Next.js defaults (legacy eslintrc format → flat config via FlatCompat).
  ...compat.extends('next/core-web-vitals', 'next/typescript'),

  // ===== Maelify framework — universal rules =====
  {
    plugins: {
      sonarjs,
      'unused-imports': unusedImports,
      // `import` plugin is already registered by `next/typescript` via FlatCompat.
    },
    rules: {
      // Maelify §2: Zero `any` policy. No exceptions.
      '@typescript-eslint/no-explicit-any': 'error',
      // Maelify §2: Explicit return types on exported (module-boundary) functions.
      '@typescript-eslint/explicit-module-boundary-types': 'warn',

      // Maelify §2: Descriptive names. Bans `q`, `d`, `res`, `val`, `tmp`.
      'id-length': [
        'error',
        {
          min: 2,
          exceptions: ['_', 'i', 'j', 'k', 'x', 'y', 'z', 't'],
          properties: 'never',
        },
      ],

      // Maelify §3: SonarQube parity (parse fns, equality, vars).
      radix: ['error', 'always'],
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
      'no-var': 'error',
      curly: ['warn', 'multi-line'],

      // Maelify §3: No duplicate logic.
      'sonarjs/cognitive-complexity': ['warn', 15],
      'sonarjs/no-duplicate-string': ['warn', { threshold: 4 }],
      'sonarjs/no-identical-functions': 'error',
      'sonarjs/prefer-immediate-return': 'warn',
      'sonarjs/no-redundant-jump': 'warn',
      'sonarjs/no-collapsible-if': 'warn',
      'sonarjs/no-useless-catch': 'error',
      'sonarjs/prefer-single-boolean-return': 'warn',

      // Maelify §3: No unused imports / orphans.
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
      ],

      // Maelify §6: Clean import order.
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
          pathGroups: [{ pattern: '@/**', group: 'internal' }],
          pathGroupsExcludedImportTypes: ['type'],
        },
      ],

      // Maelify §3: GraphQL strings must live INSIDE the function that calls them.
      'no-restricted-syntax': [
        'warn',
        {
          selector:
            "Program > VariableDeclaration > VariableDeclarator[init.type='TemplateLiteral'][init.quasis.0.value.raw=/^\\s*(#graphql|query |mutation |subscription |fragment )/i]",
          message:
            'Maelify §3: GraphQL strings must live INSIDE the function that executes them — not at module level.',
        },
      ],
    },
  },

  // Storefront pages may use inline JSX text — relax id-length there only.
  {
    files: ['src/app/**/*.tsx', 'src/components/**/*.tsx'],
    rules: { 'id-length': 'off' },
  },

  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'coverage/**',
    'next-env.d.ts',
    'src/lib/shopify/types.generated.ts',
  ]),
]);

export default eslintConfig;
