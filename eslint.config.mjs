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
    ignores: ['.next/**', 'dist/**', 'node_modules/**']
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
          type: 'ecs',
          pattern: 'src/game/ecs/*'
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

      'max-lines': ['error', 300],

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

      'functional/no-loop-statements': 'error',

      /*
       * Boundaries
       */

      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',

          rules: [
            {
              from: 'ecs',
              allow: ['ecs']
            },

            {
              from: 'gameplay',
              allow: ['gameplay', 'ecs']
            },

            {
              from: 'rendering',
              allow: ['rendering', 'ecs']
            },

            {
              from: 'ui',
              allow: ['ui', 'ecs', 'gameplay']
            }
          ]
        }
      ]
    }
  }
)
