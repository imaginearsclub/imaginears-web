import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import security from 'eslint-plugin-security';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import nextPlugin from '@next/eslint-plugin-next';

export default [
  // Base configuration
  js.configs.recommended,
  
  // Global ignores
  {
    ignores: [
      'node_modules/',
      '.next/',
      'out/',
      'coverage/',
      'dist/',
      'build/',
      '*.config.js',
      '*.config.cjs',
      '*.config.mjs',
      '*.config.ts'
    ]
  },
  
  // TypeScript files
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        },
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname
      },
      globals: {
        React: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        document: 'readonly',
        window: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        process: 'readonly',
        crypto: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': typescript,
      'security': security,
      'jsx-a11y': jsxA11y,
      'react': react,
      'react-hooks': reactHooks,
      '@next/next': nextPlugin
    },
    settings: {
      react: {
        version: 'detect'
      }
    },
    rules: {
      // Security rules
      'no-console': ['warn', { 'allow': ['warn', 'error'] }],
      'security/detect-object-injection': 'warn',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-unsafe-regex': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'warn',
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-non-literal-fs-filename': 'warn',
      'security/detect-non-literal-require': 'warn',
      'security/detect-possible-timing-attacks': 'warn',
      'security/detect-pseudoRandomBytes': 'error',
      
      // TypeScript security and performance rules
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/prefer-readonly': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      
      // Performance and maintainability rules (relaxed for existing codebase)
      'max-lines': ['warn', { 'max': 500, 'skipBlankLines': true }],
      'max-lines-per-function': ['warn', { 'max': 100, 'skipBlankLines': true }],
      'complexity': ['warn', { 'max': 15 }],
      'max-depth': ['warn', { 'max': 6 }],
      'max-params': ['warn', { 'max': 6 }],
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-template': 'error',
      'no-duplicate-imports': 'error',
      'no-unused-expressions': 'error',
      
      // React performance rules
      'react/jsx-no-bind': ['warn', { 'allowArrowFunctions': true }],
      'react/jsx-no-constructed-context-values': 'error',
      'react/no-array-index-key': 'warn',
      'react/no-unstable-nested-components': 'error',
      'react/prefer-stateless-function': 'warn',
      'react/jsx-no-target-blank': ['warn', { 'allowReferrer': true }],
      
      // Next.js specific rules
      '@next/next/no-img-element': 'error',
      
      // Accessibility rules
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-has-content': 'error',
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/heading-has-content': 'error',
      'jsx-a11y/img-redundant-alt': 'error',
      'jsx-a11y/no-access-key': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error'
    }
  },
  
  // JavaScript files
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      ecmaFeatures: {
        jsx: true
      },
      globals: {
        React: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        document: 'readonly',
        window: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        process: 'readonly',
        crypto: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly'
      }
    },
    plugins: {
      'security': security,
      'jsx-a11y': jsxA11y,
      'react': react,
      'react-hooks': reactHooks,
      '@next/next': nextPlugin
    },
    rules: {
      // Security rules
      'no-console': ['warn', { 'allow': ['warn', 'error'] }],
      'security/detect-object-injection': 'warn',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-unsafe-regex': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'warn',
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-non-literal-fs-filename': 'warn',
      'security/detect-non-literal-require': 'warn',
      'security/detect-possible-timing-attacks': 'warn',
      'security/detect-pseudoRandomBytes': 'error',
      
      // Performance and maintainability rules
      'max-lines': ['error', { 'max': 300, 'skipBlankLines': true }],
      'max-lines-per-function': ['error', { 'max': 50, 'skipBlankLines': true }],
      'complexity': ['error', { 'max': 10 }],
      'max-depth': ['error', { 'max': 4 }],
      'max-params': ['error', { 'max': 4 }],
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-template': 'error',
      'no-duplicate-imports': 'error',
      'no-unused-expressions': 'error',
      
      // React performance rules
      'react/jsx-no-bind': ['warn', { 'allowArrowFunctions': true }],
      'react/jsx-no-constructed-context-values': 'error',
      'react/no-array-index-key': 'warn',
      'react/no-unstable-nested-components': 'error',
      'react/prefer-stateless-function': 'warn',
      'react/jsx-no-target-blank': ['warn', { 'allowReferrer': true }],
      
      // Next.js specific rules
      '@next/next/no-img-element': 'error',
      
      // Accessibility rules
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-has-content': 'error',
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/heading-has-content': 'error',
      'jsx-a11y/img-redundant-alt': 'error',
      'jsx-a11y/no-access-key': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error'
    }
  },
  
  // Config files override
  {
    files: ['*.config.{js,cjs,mjs,ts}', 'next.config.ts', 'postcss.config.mjs', 'tailwind.config.ts', 'prisma/*.ts', 'scripts/**/*.{ts,js}'],
    languageOptions: {
      globals: {
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        Buffer: 'readonly',
        global: 'readonly'
      }
    },
    rules: {
      // Relax some rules for config files
      '@typescript-eslint/no-explicit-any': 'warn',
      'security/detect-child-process': 'off',
      'security/detect-non-literal-require': 'off'
    }
  },
  
  // Test files override
  {
    files: ['**/*.test.{ts,tsx,js,jsx}', '**/*.spec.{ts,tsx,js,jsx}'],
    rules: {
      // Relax rules for test files
      '@typescript-eslint/no-explicit-any': 'off',
      'max-lines-per-function': 'off',
      'complexity': 'off'
    }
  }
];
