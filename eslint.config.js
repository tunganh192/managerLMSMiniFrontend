import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import eslintPluginVue from 'eslint-plugin-vue'
import globals from 'globals'

export default [
    js.configs.recommended,
    ...eslintPluginVue.configs['flat/recommended'],
    { ignores: ['node_modules', 'dist'] },
    {
        languageOptions: {
            globals: { ...globals.browser },
        },
    },
    {
        files: ['**/*.vue'],
        rules: {
            'vue/multi-word-component-names': 'off',
            'vue/html-indent': 'off',
            'vue/max-attributes-per-line': 'off',
            'vue/html-self-closing': 'off',
            'vue/attributes-order': 'off',
            'vue/singleline-html-element-content-newline': 'off',
            'vue/multiline-html-element-content-newline': 'off',
            'vue/no-deprecated-v-bind-sync': 'off',
            'vue/no-deprecated-v-on-native-modifier': 'off',
            'vue/no-deprecated-slot-scope-attribute': 'off',
            'vue/no-deprecated-slot-attribute': 'off',
            'vue/no-deprecated-destroyed-lifecycle': 'off',
            'vue/require-explicit-emits': 'off',
            'vue/no-lone-template': 'off',
        },
    },
    {
        rules: {
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            'no-undef': 'off',
        },
    },
    eslintConfigPrettier,
    eslintPluginPrettierRecommended,
]
