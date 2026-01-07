/**
 * Iframe Preview Entry Point
 *
 * This is a completely isolated entry point for the iframe preview app.
 * It's designed to be built as a separate bundle with NO dependencies on the parent app.
 *
 * Key isolation strategy:
 * - Uses CDN-loaded Vue and Vue Router (via import maps in the HTML)
 * - Does NOT import any modules that could have side effects from the parent app
 * - Blocks and layouts are loaded dynamically via virtual modules at runtime
 */

import { createApp, ref, watch, h, type App } from "vue";
import type { Block } from "../../types/Block";
import "./iframePreviewApp.scss";

// Import EditorPageRenderer - this will pull in the blocks/layouts
// but via virtual modules that are resolved at build time
import EditorPageRenderer from "../EditorPageRenderer/EditorPageRenderer.vue";

export interface IframeAppState {
   pageData: Record<string, any> | null;
   activeBlock: Block | null;
   hoveredBlockId: string | null;
   blocksKey: string;
   settingsKey: string;
   settingsOpen: boolean;
   theme: string;
}

/**
 * Create and mount the Vue app for the iframe preview
 * This function is completely self-contained and doesn't rely on any parent app code
 */
export async function createIframeApp(container: HTMLElement): Promise<App> {
   // State
   const pageData = ref<Record<string, any> | null>(null);
   const activeBlock = ref<Block | null>(null);
   const hoveredBlockId = ref<string | null>(null);
   const settingsOpen = ref<boolean>(false);
   const blocksKey = ref<string>("blocks");
   const settingsKey = ref<string>("settings");
   const theme = ref<string>("default");
   const stylesheetsLoaded = ref<boolean>(false);

   // Serialize data for postMessage (handles Vue reactive proxies)
   function serializeForPostMessage(data: any): any {
      try {
         return JSON.parse(JSON.stringify(data));
      } catch {
         return undefined;
      }
   }

   // Message handler
   function sendToParent(message: any) {
      if (window.parent) {
         const serializedMessage = serializeForPostMessage(message);
         if (!serializedMessage) {
            return;
         }
         window.parent.postMessage(serializedMessage, "*");
      }
   }

   // Handle messages from parent
   window.addEventListener("message", (event: MessageEvent) => {
      const msg = event.data;
      if (!msg || !msg.type) return;

      switch (msg.type) {
         case "UPDATE_PAGE_DATA":
            if (msg.pageData) {
               pageData.value = msg.pageData;
            }
            if (msg.blocksKey) {
               blocksKey.value = msg.blocksKey;
            }
            if (msg.settingsKey) {
               settingsKey.value = msg.settingsKey;
            }
            if (msg.theme) {
               theme.value = msg.theme;
            }
            break;
         case "SET_ACTIVE_BLOCK":
            activeBlock.value = msg.block;
            break;
         case "SET_HOVERED_BLOCK":
            hoveredBlockId.value = msg.blockId;
            break;
         case "SET_SETTINGS_OPEN":
            settingsOpen.value = msg.settingsOpen;
            break;
         case "SCROLL_TO_BLOCK": {
            const block = document.querySelector(`[data-block-id="${msg.blockId}"]`);
            if (block) {
               block.scrollIntoView({ behavior: "smooth", block: "center" });
            }
            break;
         }
         case "INJECT_STYLESHEETS": {
            const loadPromises: Promise<void>[] = [];

            // Inject external stylesheets from parent (<link> tags)
            if (msg.stylesheetUrls && Array.isArray(msg.stylesheetUrls)) {
               msg.stylesheetUrls.forEach((href: string) => {
                  if (!document.querySelector(`link[href="${href}"]`)) {
                     const link = document.createElement("link");
                     link.rel = "stylesheet";
                     link.href = href;

                     const loadPromise = new Promise<void>((resolve) => {
                        link.onload = () => resolve();
                        link.onerror = () => resolve();
                     });
                     loadPromises.push(loadPromise);

                     document.head.appendChild(link);
                  }
               });
            }

            // Inject inline styles from parent (<style> tags)
            if (msg.inlineStyles && Array.isArray(msg.inlineStyles)) {
               document.querySelectorAll("style[data-wswg-parent-style]").forEach((el) => el.remove());
               msg.inlineStyles.forEach((content: string, index: number) => {
                  const style = document.createElement("style");
                  style.setAttribute("data-wswg-parent-style", String(index));
                  style.textContent = content;
                  document.head.appendChild(style);
               });
            }

            // Inject CSS variables
            if (msg.cssVariables) {
               let varsStyle = document.getElementById("wswg-parent-css-vars");
               if (!varsStyle) {
                  varsStyle = document.createElement("style");
                  varsStyle.id = "wswg-parent-css-vars";
                  document.head.appendChild(varsStyle);
               }
               varsStyle.textContent = msg.cssVariables;
            }

            // Wait for all external stylesheets to load, then notify parent
            if (loadPromises.length > 0) {
               Promise.all(loadPromises).then(() => {
                  stylesheetsLoaded.value = true;
                  sendToParent({ type: "STYLESHEETS_LOADED" });
               });
            } else {
               stylesheetsLoaded.value = true;
               sendToParent({ type: "STYLESHEETS_LOADED" });
            }
            break;
         }
      }
   });

   // Create Vue app
   const app = createApp({
      components: {
         EditorPageRenderer,
      },
      setup() {
         const isPageReady = ref(false);

         watch(
            () => pageData.value,
            async (newPageData) => {
               if (newPageData && newPageData[blocksKey.value]) {
                  await new Promise((resolve) => setTimeout(resolve, 200));
                  isPageReady.value = true;
               } else {
                  isPageReady.value = false;
               }
            },
            { immediate: true }
         );

         return () => {
            const currentPageData = pageData.value;
            const hasPageData = currentPageData && currentPageData[blocksKey.value];
            const blocks = hasPageData && currentPageData ? currentPageData[blocksKey.value] : [];

            if (isPageReady.value && stylesheetsLoaded.value && currentPageData) {
               return h(EditorPageRenderer, {
                  blocks: blocks,
                  layout: currentPageData[settingsKey.value]?.layout,
                  settings: currentPageData[settingsKey.value],
                  activeBlock: activeBlock.value,
                  hoveredBlockId: hoveredBlockId.value,
                  settingsOpen: settingsOpen.value,
                  editable: true,
                  theme: theme.value,
               });
            } else {
               return h("div", { class: "iframe-preview-loading" }, [
                  h("div", { class: "iframe-preview-loading__container" }, [
                     h(
                        "svg",
                        {
                           class: "iframe-preview-loading__spinner",
                           xmlns: "http://www.w3.org/2000/svg",
                           fill: "none",
                           viewBox: "0 0 24 24",
                        },
                        [
                           h("circle", {
                              class: "iframe-preview-loading__spinner-circle",
                              cx: "12",
                              cy: "12",
                              r: "10",
                              stroke: "currentColor",
                              "stroke-width": "4",
                           }),
                           h("path", {
                              class: "iframe-preview-loading__spinner-path",
                              fill: "currentColor",
                              d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z",
                           }),
                        ]
                     ),
                     h("span", { class: "iframe-preview-loading__text" }, "Loading preview..."),
                  ]),
               ]);
            }
         };
      },
   });

   // Try to install Unhead plugin if available
   // Use dynamic import via Function to avoid static analysis
   const dynamicImport = new Function("modulePath", "return import(modulePath)") as (path: string) => Promise<any>;

   try {
      const headModule = await dynamicImport("@vueuse/head");
      if (headModule && typeof headModule.createHead === "function") {
         const head = headModule.createHead();
         app.use(head);
      }
   } catch {
      // @vueuse/head not available - that's fine
   }

   // Create a minimal router for the iframe app
   // CRITICAL: We must use the SAME vue-router instance that the consuming app's components use.
   // Vue Router uses Symbol() for injection keys, so different module instances = different symbols.
   //
   // Strategy:
   // 1. ALWAYS try dynamic import first - this gets the same vue-router that components use
   //    (Vite deduplicates modules, so all imports resolve to the same instance)
   // 2. Only fall back to window.VueRouter if dynamic import fails
   //    (in production with import maps, both should resolve to the same CDN module anyway)
   let VueRouter: any = null;

   // Try dynamic import first - this ensures we get the same vue-router instance as components
   try {
      VueRouter = await import("vue-router");
   } catch {
      // Dynamic import failed, try window.VueRouter as fallback
      VueRouter = (window as any).VueRouter;
   }

   if (VueRouter && typeof VueRouter.createRouter === "function") {
      try {
         const router = VueRouter.createRouter({
            // Use memory history - this doesn't interact with the browser URL at all
            history: VueRouter.createMemoryHistory(),
            routes: [
               {
                  path: "/",
                  component: { template: "<div></div>" },
               },
               {
                  // Catch-all route to prevent 404s
                  path: "/:pathMatch(.*)*",
                  component: { template: "<div></div>" },
               },
            ],
         });

         // Patch resolve to ensure matched array exists (required by RouterLink)
         const originalResolve = router.resolve.bind(router);
         router.resolve = (to: any) => {
            const resolved = originalResolve(to) as any;
            if (resolved && (!resolved.matched || resolved.matched.length === 0)) {
               resolved.matched = [
                  {
                     path: resolved.path || "/",
                     name: resolved.name,
                     meta: resolved.meta || {},
                     components: {},
                     children: [],
                  },
               ];
            }
            return resolved;
         };

         app.use(router);
         await router.isReady();
      } catch (e) {
         console.warn("[iframe preview] Could not install router:", e);
      }
   } else {
      console.warn("[iframe preview] VueRouter not available - RouterLink components may fail");
   }

   // Mount the app
   container.innerHTML = "";
   const mountPoint = document.createElement("div");
   container.appendChild(mountPoint);
   app.mount(mountPoint);

   // Notify parent that iframe is ready
   sendToParent({ type: "IFRAME_READY" });

   return app;
}

// Register on window for the HTML to access
if (typeof window !== "undefined") {
   (window as any).__wswg_createIframeApp = createIframeApp;
}
