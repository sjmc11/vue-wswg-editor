/**
 * Iframe Preview Vue Application
 *
 * This file creates a Vue application that runs inside the iframe preview.
 * Since the library is consumed as source code, consuming apps' Vite builds
 * will process this file, giving it access to virtual modules (blocks/layouts).
 *
 * Usage in consuming apps:
 * ```ts
 * import { createIframeApp, getIframeAppModuleUrl } from 'vue-wswg-editor/IframePreviewApp'
 * ```
 */

import { createApp, ref, watch, h, type App } from "vue";
import EditorPageRenderer from "../EditorPageRenderer/EditorPageRenderer.vue";
import type { Block } from "../../types/Block";

/**
 * Get the URL of this module
 * This can be used to import the module in the iframe HTML
 */
export function getIframeAppModuleUrl(): string {
   // Use import.meta.url to get the current module's URL
   // In development, this will be the source file URL
   // In production (after Vite build), this will be the bundled module URL
   return import.meta.url;
}

export interface IframeAppState {
   pageData: Record<string, any> | null;
   activeBlock: Block | null;
   hoveredBlockId: string | null;
   blocksKey: string;
   settingsKey: string;
   settingsOpen: boolean;
   theme: string;
}

export interface IframeAppCallbacks {
   onBlockClick?: (blockId: string, block: Block | null) => void;
   onBlockHover?: (blockId: string | null) => void;
}

/**
 * Create and mount the Vue app for the iframe preview
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
         // Serialize message to handle Vue reactive proxies
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
      }
   });

   // Create Vue app using render function (since we're using runtime-only Vue)
   const app = createApp({
      components: {
         EditorPageRenderer,
      },
      setup() {
         // Ensure PageRenderer has time to load blocks before rendering
         const isPageReady = ref(false);

         // Watch for pageData changes
         watch(
            () => pageData.value,
            async (newPageData) => {
               if (newPageData && newPageData[blocksKey.value]) {
                  // Give PageRenderer time to load block modules
                  // PageRenderer loads blocks in onBeforeMount, so we need to wait
                  await new Promise((resolve) => setTimeout(resolve, 200));
                  isPageReady.value = true;
               } else {
                  isPageReady.value = false;
               }
            },
            { immediate: true }
         );

         // Render function
         return () => {
            const currentPageData = pageData.value;
            const hasPageData = currentPageData && currentPageData[blocksKey.value];
            const blocks = hasPageData && currentPageData ? currentPageData[blocksKey.value] : [];

            if (isPageReady.value && currentPageData) {
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
               // Show loading state while PageRenderer loads blocks
               return h("div", { class: "bg-white px-5 py-12 md:py-20" }, [
                  h("div", { class: "mx-auto max-w-md pb-7 text-center" }, [
                     h(
                        "svg",
                        {
                           class: "mx-auto size-8 animate-spin text-blue-600",
                           xmlns: "http://www.w3.org/2000/svg",
                           fill: "none",
                           viewBox: "0 0 24 24",
                        },
                        [
                           h("circle", {
                              class: "opacity-25",
                              cx: "12",
                              cy: "12",
                              r: "10",
                              stroke: "currentColor",
                              "stroke-width": "4",
                           }),
                           h("path", {
                              class: "opacity-75",
                              fill: "currentColor",
                              d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z",
                           }),
                        ]
                     ),
                     h("span", { class: "mt-4 text-gray-700" }, "Loading preview..."),
                  ]),
               ]);
            }
         };
      },
   });

   // Dynamic import helper - using Function constructor to create a truly dynamic import
   // that Vite cannot analyze statically, preventing build-time resolution errors
   // eslint-disable-next-line @typescript-eslint/ban-ts-comment
   // @ts-ignore - modules may not be available in all consuming apps
   const dynamicImport = new Function("modulePath", "return import(modulePath)");

   // Try to install Unhead plugin if available
   // This is needed for layouts that use useHead from @vueuse/head
   try {
      // Dynamic import to check if @vueuse/head is available
      // This module is externalized in vite.config.ts so it won't be bundled
      const headModule = await dynamicImport("@vueuse/head");
      if (headModule && typeof headModule.createHead === "function") {
         const head = headModule.createHead();
         app.use(head);
      }
   } catch {
      // @vueuse/head not available - layouts using useHead will show warnings but won't break
      // This is expected if the consuming app doesn't use @vueuse/head
   }

   // Try to use vue-router - first try from CDN, but components use consuming app's vue-router
   // The issue is that components from the consuming app use their own vue-router instance
   // with different Symbol keys. We need to use the same instance they're using.
   // Try to import vue-router dynamically - this will use the consuming app's vue-router
   // if it's available in the module resolution context
   let VueRouter: any = null;
   let routerInstalled = false;

   try {
      // Try dynamic import - this should resolve to the consuming app's vue-router
      // when the library is consumed as source code
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - vue-router may not be available in all consuming apps
      const routerModule = await import("vue-router");
      VueRouter = routerModule;
   } catch {
      // Fallback to CDN version
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      VueRouter = typeof window !== "undefined" ? (window as any).VueRouter : null;
   }

   if (VueRouter && typeof VueRouter.createRouter === "function") {
      try {
         // Create a minimal router instance
         const router = VueRouter.createRouter({
            history: VueRouter.createMemoryHistory(),
            routes: [
               {
                  path: "/",
                  component: { template: "<div></div>" },
               },
               {
                  path: "/:pathMatch(.*)*",
                  component: { template: "<div></div>" },
               },
            ],
         });

         // Store original resolve to call it first, then ensure matched array exists
         const originalResolve = router.resolve.bind(router);
         router.resolve = (to: any) => {
            // Call original resolve to get proper route structure
            const resolved = originalResolve(to);
            // Ensure the resolved route has a matched array (useLink requires this)
            if (resolved.route && (!resolved.route.matched || resolved.route.matched.length === 0)) {
               resolved.route.matched = [
                  {
                     path: resolved.route.path || "/",
                     name: resolved.route.name,
                     meta: resolved.route.meta || {},
                     components: {},
                     children: [],
                  },
               ];
            }
            return resolved;
         };

         // Install router BEFORE mounting - this provides the router injection
         // The app.use() call should handle the Symbol keys automatically
         app.use(router);

         // Wait for router to be ready before mounting
         await router.isReady();

         // Ensure currentRoute has proper structure with matched array
         // currentRoute.value is readonly, so we navigate to ensure route is properly resolved
         // eslint-disable-next-line @typescript-eslint/ban-ts-comment
         // @ts-ignore
         const currentRoute = router.currentRoute.value;
         if (currentRoute && (!currentRoute.matched || currentRoute.matched.length === 0)) {
            // Navigate to ensure route has proper matched array
            await router.push("/");
         }

         routerInstalled = true;
      } catch {
         // Fall through to mount without router
      }
   }

   if (!routerInstalled) {
      // Router was not installed - RouterLink components will fail
      console.warn("[iframe preview] Router was not installed - RouterLink components will fail");
   }
   // Mount the app
   app.mount(container);

   // Notify parent that iframe is ready
   sendToParent({ type: "IFRAME_READY" });

   return app;
}
