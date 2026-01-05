<template>
   <div ref="containerRef" class="iframe-preview-container">
      <iframe ref="iframeRef" title="Page preview" :src="iframeSrc" class="iframe-preview" frameborder="0"></iframe>
   </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick, computed } from "vue";
import {
   sendPageDataUpdate,
   sendActiveBlock,
   sendHoveredBlock,
   sendSettingsOpen,
   sendScrollToBlock,
   handleIframeMessage,
   sendStylesheets,
} from "./messageHandler";
import type { Block } from "../../types/Block";
import { IFRAME_PREVIEW_ROUTE } from "../../constants";
import { getIframeAppModuleUrl } from "./iframePreviewApp";

const props = defineProps<{
   pageData?: Record<string, any>;
   activeBlock: Block | null;
   hoveredBlockId: string | null;
   viewport: "desktop" | "mobile";
   editable?: boolean;
   blocksKey?: string;
   settingsKey?: string;
   settingsOpen?: boolean;
   theme?: string;
}>();

const emit = defineEmits<{
   (e: "click-block", block: Block | null): void;
   (e: "hover-block", blockId: string | null): void;
   (e: "block-reorder", oldIndex: number, newIndex: number): void;
   (e: "block-add", blockType: string, index: number): void;
   (e: "click-partial", partialValue: string): void;
}>();

const iframeRef = ref<HTMLIFrameElement | null>(null);
const containerRef = ref<HTMLElement | null>(null);
const iframeReady = ref(false);
const stylesheetsLoaded = ref(false);
const iframeSrc = ref<string>("");

const blocksKey = computed(() => props.blocksKey || "blocks");
const settingsKey = computed(() => props.settingsKey || "settings");

// Get the iframe app module URL for fallback
const iframeAppModuleUrl = getIframeAppModuleUrl();

// Create iframe src using the virtual route served by the vite plugin
// This keeps the iframe on the same origin, enabling module imports to work in WebContainers
function createIframeSrc(): string {
   // Use the virtual route provided by the vite plugin
   // Pass the module URL as a query parameter for fallback in case the virtual module doesn't work
   const moduleUrlParam = encodeURIComponent(iframeAppModuleUrl);
   // Use /index.html suffix to ensure the file is served directly in production
   // In development, the middleware still catches this because it matches startsWith
   return `${IFRAME_PREVIEW_ROUTE}/index.html?moduleUrl=${moduleUrlParam}`;
}

// Update iframe content - send pageData to Vue app in iframe
async function updateIframeContent() {
   if (!iframeRef.value || !iframeReady.value || !stylesheetsLoaded.value) return;
   if (!props.pageData || !props.pageData[blocksKey.value]) return;

   await nextTick();
   sendPageDataUpdate(iframeRef.value, props.pageData, blocksKey.value, settingsKey.value, props.theme || "default");
}

// Setup message listener
let messageListener: ((event: MessageEvent) => void) | null = null;

function setupMessageListener() {
   messageListener = (event: MessageEvent) => {
      // Only handle messages from our iframe
      if (event.source !== iframeRef.value?.contentWindow) return;

      handleIframeMessage(event, {
         onBlockClick: (_blockId: string, block: any) => {
            emit("click-block", block);
         },
         onBlockHover: (blockId: string | null) => {
            emit("hover-block", blockId);
         },
         onBlockReorder: (oldIndex: number, newIndex: number) => {
            emit("block-reorder", oldIndex, newIndex);
         },
         onBlockAdd: (blockType: string, index: number) => {
            emit("block-add", blockType, index);
         },
         onPartialClick: (partialValue: string) => {
            emit("click-partial", partialValue);
         },
         onIframeReady: () => {
            iframeReady.value = true;
            // Send stylesheets to iframe first - wait for STYLESHEETS_LOADED before sending content
            if (iframeRef.value) {
               sendStylesheets(iframeRef.value);
            }
         },
         onStylesheetsLoaded: () => {
            stylesheetsLoaded.value = true;
            // Now that stylesheets are loaded, send the content
            updateIframeContent();
            // Send initial settingsOpen state
            if (iframeRef.value && props.settingsOpen !== undefined) {
               sendSettingsOpen(iframeRef.value, props.settingsOpen);
            }
         },
      });
   };

   window.addEventListener("message", messageListener);
}

function cleanupMessageListener() {
   if (messageListener) {
      window.removeEventListener("message", messageListener);
      messageListener = null;
   }
}

// Watch for pageData changes
watch(
   [() => props.pageData, () => props.theme],
   async () => {
      await nextTick();
      updateIframeContent();
   },
   { deep: true }
);

// Watch for activeBlock changes
watch(
   () => props.activeBlock,
   async (block) => {
      if (iframeRef.value && iframeReady.value) {
         sendActiveBlock(iframeRef.value, block || null);
         // Also scroll to block
         if (block?.id) {
            await nextTick();
            sendScrollToBlock(iframeRef.value, block.id);
         }
      }
   }
);

// Watch for hoveredBlockId changes
watch(
   () => props.hoveredBlockId,
   (blockId) => {
      if (iframeRef.value && iframeReady.value) {
         sendHoveredBlock(iframeRef.value, blockId);
      }
   }
);

// Watch for settingsOpen changes
watch(
   () => props.settingsOpen,
   (settingsOpen) => {
      if (iframeRef.value && iframeReady.value) {
         sendSettingsOpen(iframeRef.value, settingsOpen ?? false);
      }
   }
);

onMounted(() => {
   iframeSrc.value = createIframeSrc();
   setupMessageListener();
});

onBeforeUnmount(() => {
   cleanupMessageListener();
});
</script>

<style scoped lang="scss">
.iframe-preview-container {
   height: -webkit-fill-available;

   &.mobile-viewport {
      .iframe-preview {
         max-width: 384px;
         margin: 0 auto;
      }
   }
}

.iframe-preview {
   display: block;
   width: 100%;
   height: 100%;
   background: white;
   border: none;
}

.hidden-renderer {
   position: absolute;
   top: -9999px;
   left: -9999px;
   visibility: hidden;
   width: 1px;
   height: 1px;
   overflow: hidden;
   pointer-events: none;
   opacity: 0;
}
</style>
