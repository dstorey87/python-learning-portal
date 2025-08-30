module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module'
    },
    plugins: ['@typescript-eslint'],
    extends: [
        'eslint:recommended'
    ],
    root: true,
    env: {
        node: true,
        es6: true
    },
    rules: {
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        'no-console': 'off', // Allow console.log for execution service
        'prefer-const': 'error'
    },
    ignorePatterns: [
        'dist/',
        'node_modules/',
        '*.js'
    ]
};