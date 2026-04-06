// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
    files: ['**/*.vue', '**/*.ts', '**/*.tsx', '**/*.js', '**/*.mjs'],
    rules: {
        // Disable conflicting @stylistic rules
        '@stylistic/indent': 'off',
        '@stylistic/semi': 'off',
        '@stylistic/comma-dangle': 'off',
        '@stylistic/quotes': 'off',

        // Vue rules
        'vue/require-default-prop': 'off',
        'vue/attribute-hyphenation': 'off',
        'vue/v-on-event-hyphenation': 'off',
        'vue/multi-word-component-names': 'off',
        'vue/no-v-html': 'off',
        'vue/html-indent': ['error', 4],

        // TypeScript rules
        '@typescript-eslint/no-explicit-any': 'off',

        // Formatting rules
        'indent': ['error', 4],
        'semi': ['error', 'never'],
        'quotes': ['error', 'single'],
        'linebreak-style': ['error', 'unix']
    }
})
