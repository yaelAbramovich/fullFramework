import tseslint from 'typescript-eslint';

// Minimal ESLint flat config focused on Playwright-related correctness.
// The no-floating-promises rule is explicitly recommended by
// https://playwright.dev/docs/best-practices to catch missing awaits
// before Playwright API calls.
export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'playwright-report/**', 'test-results/**'],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },
);
