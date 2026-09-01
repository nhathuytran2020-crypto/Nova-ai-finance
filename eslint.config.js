import tseslint from 'typescript-eslint';
import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

const rulesConfig = firebaseRulesPlugin.configs['flat/recommended'];
const formattedRulesConfig = Array.isArray(rulesConfig)
  ? rulesConfig.map(cfg => ({ ...cfg, files: ['**/*.rules'] }))
  : { ...rulesConfig, files: ['**/*.rules'] };

export default [
  {
    ignores: ['dist/**/*', 'node_modules/**/*']
  },
  ...tseslint.configs.recommended.map(cfg => ({
    ...cfg,
    files: ['src/**/*.ts', 'src/**/*.tsx']
  })),
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      'prefer-const': 'off'
    }
  },
  formattedRulesConfig
];
