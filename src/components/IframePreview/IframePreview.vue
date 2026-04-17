<template>
   <div class="iframe-preview-container">
      <iframe
         v-if="iframeSrc"
         ref="iframeRef"
         title="Page preview"
         :src="iframeSrc"
         class="iframe-preview"
         frameborder="0"
      ></iframe>

      <teleport v-if="slots.empty && emptySlotTeleportTarget" :to="emptySlotTeleportTarget">
         <slot name="empty" />
      </teleport>
   </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick, computed, useSlots } from "vue";
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
   extraProps?: Record<string, any>;
}>();

const emit = defineEmits<{
   (e: "click-block", block: Block | null): void;
   (e: "hover-block", blockId: string | null): void;
   (e: "block-reorder", oldIndex: number, newIndex: number): void;
   (e: "block-add", blockType: string, index: number): void;
   (e: "click-partial", partialValue: string): void;
}>();

const iframeRef = ref<HTMLIFrameElement | null>(null);
const iframeReady = ref(false);
const stylesheetsLoaded = ref(false);
const emptySlotTeleportTarget = ref<HTMLElement | null>(null);
const slots = useSlots();
let emptySlotTargetRetryTimer: ReturnType<typeof setTimeout> | null = null;

const blocksKey = computed(() => props.blocksKey || "blocks");
const settingsKey = computed(() => props.settingsKey || "settings");

// Create iframe src using the virtual route served by the vite plugin
// This HTML file is generated during build and served by the vite plugin middleware in dev
// In production, users need to configure their server to serve this file
const iframeSrc = ref<string>(IFRAME_PREVIEW_ROUTE);

// Update iframe content - send pageData to Vue app in iframe
async function updateIframeContent() {
   if (!iframeRef.value || !iframeReady.value || !stylesheetsLoaded.value) return;
   if (!props.pageData || !props.pageData[blocksKey.value]) return;

   await nextTick();
   sendPageDataUpdate(
      iframeRef.value,
      props.pageData,
      blocksKey.value,
      settingsKey.value,
      props.theme || "default",
      props.extraProps
   );

   updateEmptySlotTeleportTarget();
}

function updateEmptySlotTeleportTarget() {
   if (!slots.empty) {
      emptySlotTeleportTarget.value = null;
      return;
   }

   const iframe = iframeRef.value;
   if (!iframe?.contentDocument) {
      emptySlotTeleportTarget.value = null;
      return;
   }

   const maxAttempts = 20;
   const retryDelayMs = 50;

   if (emptySlotTargetRetryTimer) {
      clearTimeout(emptySlotTargetRetryTimer);
      emptySlotTargetRetryTimer = null;
   }

   const attemptAssignTarget = (attempt = 0) => {
      if (!iframeRef.value?.contentDocument) {
         emptySlotTeleportTarget.value = null;
         return;
      }

      const target = iframeRef.value.contentDocument.getElementById("wswg-empty-slot-target");
      if (target) {
         emptySlotTeleportTarget.value = target;
         return;
      }

      if (attempt >= maxAttempts) {
         emptySlotTeleportTarget.value = null;
         return;
      }

      emptySlotTargetRetryTimer = setTimeout(() => {
         attemptAssignTarget(attempt + 1);
      }, retryDelayMs);
   };

   attemptAssignTarget();
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
            updateEmptySlotTeleportTarget();
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
      await nextTick();
      updateEmptySlotTeleportTarget();
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
   // Only set up message listener - iframeSrcdoc is already initialized
   setupMessageListener();
});

onBeforeUnmount(() => {
   if (emptySlotTargetRetryTimer) {
      clearTimeout(emptySlotTargetRetryTimer);
      emptySlotTargetRetryTimer = null;
   }
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
