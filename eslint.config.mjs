import js from '@eslint/js'
import tseslint from 'typescript-eslint'

import sonarjs from 'eslint-plugin-sonarjs'
import unicorn from 'eslint-plugin-unicorn'
import functional from 'eslint-plugin-functional'
import boundaries from 'eslint-plugin-boundaries'

export default tseslint.config(
  /*
   * Ignore generated files
   */

  {
    ignores: [
      '.next/**',
      'dist/**',
      'node_modules/**',
      'pnpm-lock.yaml',
      'docs/markdowns/bitecs/examples/pong/dist/pong.js',
      'docs/markdowns/bitecs/examples/space-invaders/dist/space-invaders.js'
    ]
  },

  /*
   * Base JS config
   */

  js.configs.recommended,

  /*
   * Typed TypeScript config
   */

  {
    files: ['**/*.ts', '**/*.tsx'],

    extends: [...tseslint.configs.recommendedTypeChecked],

    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname
      }
    },

    plugins: {
      sonarjs,
      unicorn,
      functional,
      boundaries
    },

    settings: {
      'boundaries/elements': [
        {
          type: 'core',
          pattern: 'src/game/core/*'
        },
        {
          type: 'gameplay',
          pattern: 'src/game/gameplay/*'
        },
        {
          type: 'rendering',
          pattern: 'src/game/rendering/*'
        },
        {
          type: 'ui',
          pattern: 'src/game/ui/*'
        }
      ]
    },

    rules: {
      /*
       * Complexity
       */

      complexity: ['error', 8],

      'max-lines': ['error', 400],

      'max-lines-per-function': ['error', 40],

      'max-depth': ['error', 3],

      'max-params': ['error', 4],

      'max-statements': ['error', 20],

      'sonarjs/cognitive-complexity': ['error', 12],

      /*
       * Unicorn
       */

      'unicorn/prevent-abbreviations': 'off',

      /*
       * Functional
       */

      'functional/no-let': 'error',

      /*
       * Boundaries
       */

      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',

          rules: [
            {
              from: { type: 'core' },
              allow: ['core']
            },

            {
              from: { type: 'gameplay' },
              allow: ['gameplay', 'core']
            },

            {
              from: { type: 'rendering' },
              allow: ['rendering', 'core']
            },

            {
              from: { type: 'ui' },
              allow: ['ui', 'core', 'gameplay']
            }
          ]
        }
      ]
    }
  }
)
