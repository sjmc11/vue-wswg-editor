/**
 * Extract CSS variables from the parent document
 * Extracts variables from :root and specific selectors like .wswg-json-editor
 */
function extractParentCSSVariables(): string {
   if (typeof document === "undefined" || typeof window === "undefined") return "";

   const variables: string[] = [];

   // Get all CSS variables from :root
   const rootVariables = new Set<string>();
   const allStyles = Array.from(document.styleSheets);

   // Extract from stylesheets
   allStyles.forEach((sheet) => {
      try {
         const rules = Array.from(sheet.cssRules || sheet.rules || []);
         rules.forEach((rule) => {
            if (rule instanceof CSSStyleRule) {
               const { selectorText, style } = rule;
               // Check if this rule targets :root or html
               if (selectorText === ":root" || selectorText === "html" || selectorText === "html:root") {
                  for (let i = 0; i < style.length; i++) {
                     const property = style[i];
                     if (property.startsWith("--")) {
                        const value = style.getPropertyValue(property);
                        rootVariables.add(`${property}: ${value};`);
                     }
                  }
               }
            }
         });
      } catch {
         // Cross-origin stylesheets will throw errors, ignore them
      }
   });

   // Also extract from inline styles in <style> tags
   const styleTags = document.querySelectorAll("head style");
   styleTags.forEach((style) => {
      const content = style.textContent || style.innerHTML;
      if (content) {
         // Match CSS variable declarations
         const varRegex = /--[\w-]+\s*:\s*[^;]+;/g;
         const matches = content.match(varRegex);
         if (matches) {
            matches.forEach((match) => {
               rootVariables.add(match.trim());
            });
         }
      }
   });

   if (rootVariables.size > 0) {
      variables.push(`:root {`);
      rootVariables.forEach((variable) => {
         variables.push(`   ${variable}`);
      });
      variables.push(`}`);
   }

   return variables.length > 0 ? `<style>${variables.join("\n")}</style>` : "";
}

/**
 * Extract stylesheets from the parent document
 * This includes both <link rel="stylesheet"> tags and <style> tags
 */
function extractParentStylesheets(): string {
   if (typeof document === "undefined") return "";

   const stylesheets: string[] = [];

   // Extract <link rel="stylesheet"> tags
   const linkTags = document.querySelectorAll('head link[rel="stylesheet"]');
   linkTags.forEach((link) => {
      const href = link.getAttribute("href");
      if (href) {
         // Convert relative URLs to absolute URLs
         const absoluteHref = new URL(href, window.location.href).href;
         stylesheets.push(`<link rel="stylesheet" href="${absoluteHref}">`);
      }
   });

   // Extract <style> tags
   const styleTags = document.querySelectorAll("head style");
   styleTags.forEach((style) => {
      const content = style.textContent || style.innerHTML;
      if (content) {
         stylesheets.push(`<style>${content}</style>`);
      }
   });

   return stylesheets.join("\n   ");
}

/**
 * Generate HTML content for the iframe
 * This creates a standalone HTML page with a Vue app that will be loaded in the iframe
 * The Vue app uses PageRenderer to render blocks reactively
 *
 * @param iframeAppModuleUrl - URL to the iframe app module bundle
 *                             This should be obtained using import.meta.url from iframePreviewApp.ts
 */
export function generateIframeHTML(iframeAppModuleUrl?: string): string {
   const parentStylesheets = extractParentStylesheets();
   const parentCSSVariables = extractParentCSSVariables();
   const vueCdnUrl = "https://unpkg.com/vue@3/dist/vue.esm-browser.js";
   // Get parent origin to use as base URL for relative asset paths
   const parentOrigin = typeof window !== "undefined" ? window.location.origin : "";

   // Define Vue feature flags before Vue is loaded
   // These must be defined as global constants before any Vue code runs
   const vueFeatureFlagsScript = `<script>
      // Define Vue feature flags to prevent warnings
      // These must be defined before Vue or the library code is imported
      // Using var to make them available globally (not just on window)
      var __VUE_OPTIONS_API__ = true;
      var __VUE_PROD_DEVTOOLS__ = false;
      var __VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = false;
      
      // Also set on window for compatibility
      window.__VUE_OPTIONS_API__ = true;
      window.__VUE_PROD_DEVTOOLS__ = false;
      window.__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = false;
   </script>`;

   // Generate script that loads Vue and initializes the iframe app
   const appScript = iframeAppModuleUrl
      ? `<script type="module">
         import { createApp } from '${vueCdnUrl}';
         import { createIframeApp } from '${iframeAppModuleUrl}';
         
         const appEl = document.getElementById('app');
         if (appEl) {
            createIframeApp(appEl).catch(error => {
               console.error('Failed to create iframe app:', error);
            });
         }
      </script>`
      : `<script type="module">
         // Fallback: Wait for parent to send module URL via postMessage
         import { createApp } from '${vueCdnUrl}';
         
         let appInitialized = false;
         
         window.addEventListener('message', async (event) => {
            if (event.data.type === 'INIT_IFRAME_APP' && event.data.moduleUrl && !appInitialized) {
               appInitialized = true;
               try {
                  const { createIframeApp } = await import(event.data.moduleUrl);
                  const appEl = document.getElementById('app');
                  if (appEl) {
                     createIframeApp(appEl);
                  }
               } catch (error) {
                  console.error('Failed to load iframe app module:', error);
                  // Fallback: create minimal Vue app
                  const appEl = document.getElementById('app');
                  if (appEl) {
                     createApp({
                        template: '<div class="p-4">Loading preview...</div>'
                     }).mount(appEl);
                  }
               }
            }
         });
         
         // Notify parent that we're ready to receive module URL
         if (window.parent) {
            window.parent.postMessage({ type: 'IFRAME_READY_FOR_APP' }, '*');
         }
      </script>`;

   return `<!DOCTYPE html>
<html lang="en">
<head>
   <meta charset="UTF-8">
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   <title>Page Preview</title>
   ${parentOrigin ? `<base href="${parentOrigin}/">` : ""}
   ${parentStylesheets}
   ${parentCSSVariables}
   <style>
      /* Additional iframe-specific styles */
      html, body {
         margin: 0;
         padding: 0;
         width: 100%;
         height: 100%;
         overflow-x: hidden;
      }
      
      #app {
         width: 100%;
         min-height: 100vh;
      }
      
      .page-renderer-wrapper {
         width: 100%;
      }
   </style>
</head>
<body>
   <div id="app"></div>
   ${vueFeatureFlagsScript}
   ${appScript}
</body>
</html>`;
}
