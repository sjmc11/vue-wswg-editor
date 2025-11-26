import js from "@eslint/js";
import pluginVue from "eslint-plugin-vue";
import vueTsEslintConfig from "@vue/eslint-config-typescript";
import pluginTailwind from "eslint-plugin-tailwindcss";
import prettierLint from "@vue/eslint-config-prettier";
import vitest from "@vitest/eslint-plugin";

export default [
   {
      name: "app/files-to-lint",
      files: ["**/*.{ts,mts,tsx,vue}"],
   },

   {
      name: "app/files-to-ignore",
      ignores: ["**/dist/**", "**/coverage/**", "**/.vite-ssg-temp/**"],
   },

   // eslint:recommended
   js.configs.recommended,

   // Adding Vue and TypeScript config
   ...pluginVue.configs["flat/recommended"],
   ...vueTsEslintConfig(),

   // Tailwind CSS config
   ...pluginTailwind.configs["flat/recommended"],

   // Custom rules
   {
      files: ["**/*.{js,jsx,ts,tsx,vue}"],
      rules: {
         "vue/attribute-hyphenation": "off",
         "vue/no-use-v-if-with-v-for": ["warn", { allowUsingIterationVar: true }],
         "vue/require-default-prop": "off",
         "vue/prop-name-casing": ["warn", "camelCase"],
         "vue/v-slot-style": "off",
         "vue/multi-word-component-names": "off",
         "vue/no-v-html": "off",
         "vue/enforce-style-attribute": "off",
         "vue/block-lang": "off",
         "vue/v-on-handler-style": "off",
         "no-undef": "off",
         "no-trailing-spaces": ["error", { skipBlankLines: true }],
         camelcase: ["off", { ignoreImports: true, ignoreGlobals: true, ignoreDestructuring: true }],
         "import/no-cycle": "off",
         "arrow-body-style": "off",
         "prefer-destructuring": ["warn", { object: true, array: false }],
         "one-var": ["error", "never"],
         "no-restricted-syntax": "off",
         "linebreak-style": 0,
         "no-plusplus": ["error", { allowForLoopAfterthoughts: true }],
         "no-unused-vars": "off",
         "no-console": ["warn", { allow: ["info", "warn", "error", "clear"] }],
         "no-var": "error",
         "no-param-reassign": ["warn", { props: false }],
         "keyword-spacing": "error",
         "comma-dangle": [
            "error",
            {
               arrays: "always-multiline",
               objects: "always-multiline",
               imports: "always-multiline",
               exports: "always-multiline",
               functions: "never",
            },
         ],
         "import/extensions": "off",
         "prefer-template": "error",
         "no-useless-escape": "warn",
         "@typescript-eslint/no-explicit-any": "off",
         "@typescript-eslint/no-unused-vars": ["warn", { args: "none", vars: "all", ignoreRestSiblings: true }],
         "@typescript-eslint/no-unused-expressions": "off",
         "tailwindcss/no-custom-classname": "off",
      },
   },

   // Prettier formatting
   prettierLint,

   // vitest plugin configuration
   {
      plugins: { vitest },
      files: ["**/*.test.{js,ts}"], // vitest test files
      rules: {
         ...vitest.configs.recommended.rules,
         "vitest/no-focused-tests": ["error", { fixable: false }],
      },
   },
];
