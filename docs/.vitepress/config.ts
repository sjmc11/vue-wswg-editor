import { defineConfig } from "vitepress";

export default defineConfig({
   title: "vue-wswg-editor",
   description: "A powerful Vue 3 WYSIWYG JSON editor component library for building visual page builders",
   base: "/vue-wswg-editor/",
   themeConfig: {
      nav: [
         { text: "Home", link: "/" },
         { text: "Guide", link: "/guide/getting-started" },
         { text: "API", link: "/api/components" },
         { text: "Examples", link: "/examples/" },
      ],
      sidebar: {
         "/guide/": [
            {
               text: "Getting Started",
               items: [
                  { text: "Introduction", link: "/guide/getting-started" },
                  { text: "Installation", link: "/guide/installation" },
                  { text: "Quick Start", link: "/guide/quick-start" },
               ],
            },
            {
               text: "Concepts",
               items: [
                  { text: "Blocks", link: "/guide/blocks" },
                  { text: "Layouts", link: "/guide/layouts" },
                  { text: "Fields", link: "/guide/fields" },
                  { text: "Validation", link: "/guide/validation" },
               ],
            },
            {
               text: "Advanced",
               items: [
                  { text: "Vite Plugin", link: "/guide/vite-plugin" },
                  { text: "Custom Fields", link: "/guide/custom-fields" },
                  { text: "Styling", link: "/guide/styling" },
               ],
            },
         ],
         "/api/": [
            {
               text: "Components",
               items: [
                  { text: "WswgJsonEditor", link: "/api/components/wswg-json-editor" },
                  { text: "PageRenderer", link: "/api/components/page-renderer" },
               ],
            },
            {
               text: "Utilities",
               items: [
                  { text: "createField", link: "/api/utilities/create-field" },
                  { text: "Registry", link: "/api/utilities/registry" },
                  { text: "Validation", link: "/api/utilities/validation" },
               ],
            },
         ],
      },
      socialLinks: [
         // Add your GitHub repo link here
         // { icon: "github", link: "https://github.com/your-org/vue-wswg-editor" },
      ],
      footer: {
         message: "Released under the MIT License.",
         copyright: "Copyright © 2024",
      },
   },
});
