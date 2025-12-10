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

   // Serialize data for postMessage (handles Vue reactive proxies)
   function serializeForPostMessage(data: any): any {
      try {
         return JSON.parse(JSON.stringify(data));
      } catch (error) {
         console.warn("[iframe] Failed to serialize data for postMessage:", error);
         return undefined;
      }
   }

   // Message handler
   function sendToParent(message: any) {
      if (window.parent) {
         // Serialize message to handle Vue reactive proxies
         const serializedMessage = serializeForPostMessage(message);
         if (!serializedMessage) {
            console.error("[iframe] Failed to serialize message for postMessage");
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

   // Try to install Unhead plugin if available
   // This is needed for layouts that use useHead from @vueuse/head
   try {
      // Dynamic import to check if @vueuse/head is available
      // This module is externalized in vite.config.ts so it won't be bundled
      // Using @vite-ignore to prevent static analysis
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - @vueuse/head may not be available in all consuming apps
      const headModule = await import(/* @vite-ignore */ "@vueuse/head");
      if (headModule && typeof headModule.createHead === "function") {
         const head = headModule.createHead();
         app.use(head);
      }
   } catch {
      // @vueuse/head not available - layouts using useHead will show warnings but won't break
      // This is expected if the consuming app doesn't use @vueuse/head
   }

   // Mount the app
   app.mount(container);

   // Notify parent that iframe is ready
   sendToParent({ type: "IFRAME_READY" });

   return app;
}
