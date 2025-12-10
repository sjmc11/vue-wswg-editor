<template>
   <div class="wswg-json-editor" :class="{ 'settings-open': showPageSettings }">
      <slot v-if="loading" name="loading">
         <div class="wswg-json-editor-loading flex h-full flex-col items-center justify-center gap-4">
            <svg
               class="mx-auto size-8 animate-spin text-blue-600"
               xmlns="http://www.w3.org/2000/svg"
               fill="none"
               viewBox="0 0 24 24"
            >
               <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>

               <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
               ></path>
            </svg>
            <span>Loading editor...</span>
         </div>
      </slot>
      <!-- WYSIWYG editor -->
      <div v-else class="wswg-json-editor-body">
         <!-- Page preview -->
         <div class="wswg-json-editor-preview overflow-y-auto">
            <div
               id="page-preview-container"
               class="mx-auto flex flex-col overflow-hidden rounded-lg bg-white transition-all duration-300"
               style="height: -webkit-fill-available"
               :class="{ 'w-full': editorViewport === 'desktop', 'w-96': editorViewport === 'mobile' }"
            >
               <BrowserNavigation v-if="showBrowserBar" class="browser-navigation-bar" :url="url" />
               <IframePreview
                  v-if="iframePreview"
                  ref="previewRef"
                  :pageData="pageData"
                  :activeBlock="activeBlock"
                  :hoveredBlockId="hoveredBlockId"
                  :viewport="editorViewport"
                  :editable="editable"
                  :blocksKey="blocksKey"
                  :settingsKey="settingsKey"
                  :settingsOpen="showPageSettings"
                  @hover-block="setHoveredBlockId"
                  @click-block="handleBlockClick"
                  @block-reorder="handleBlockReorder"
                  @block-add="handleBlockAdd"
                  @click-partial="handleClickPartial"
               />
            </div>
         </div>

         <!-- Resizable divider -->
         <ResizeHandle @sidebar-width="handleSidebarWidth" />

         <!-- Sidebar -->
         <div
            id="page-builder-sidebar"
            class="page-builder-sidebar-wrapper bg-white"
            :style="{ width: sidebarWidth + 'px' }"
         >
            <PageBuilderSidebar
               v-model="pageData"
               v-model:activeBlock="activeBlock"
               v-model:hoveredBlockId="hoveredBlockId"
               v-model:showPageSettings="showPageSettings"
               v-model:showAddBlockMenu="showAddBlockMenu"
               v-model:editorViewport="editorViewport"
               :hasPageSettings="hasPageSettings"
               :editable="editable"
               :blocksKey="blocksKey"
               :settingsKey="settingsKey"
               :activeSettingsTab="activeSettingsTab"
            />
         </div>
      </div>
   </div>
</template>

<script setup lang="ts">
import {
   ref,
   shallowRef,
   withDefaults,
   watch,
   type Component,
   onBeforeMount,
   onMounted,
   nextTick,
   computed,
} from "vue";
import ResizeHandle from "../ResizeHandle/ResizeHandle.vue";
import PageBuilderSidebar from "../PageBuilderSidebar/PageBuilderSidebar.vue";
import BrowserNavigation from "../BrowserNavigation/BrowserNavigation.vue";
import IframePreview from "../IframePreview/IframePreview.vue";
import { getBlockComponent, getLayouts, initialiseRegistry } from "../../util/registry";
import type { Block } from "../../types/Block";
import Sortable from "sortablejs";
import { onKeyStroke, onClickOutside } from "@vueuse/core";

const props = withDefaults(
   defineProps<{
      editable?: boolean;
      loading?: boolean;
      url?: string;
      showBrowserBar?: boolean;
      blocksKey?: string;
      settingsKey?: string;
      defaultBlockMargin?: "none" | "small" | "medium" | "large";
      iframePreview?: boolean;
   }>(),
   {
      editable: false,
      loading: false,
      url: "",
      showBrowserBar: false,
      blocksKey: "blocks",
      settingsKey: "settings",
      defaultBlockMargin: "none",
      iframePreview: true,
   }
);

const editorViewport = ref<"desktop" | "mobile">("desktop");
const showPageSettings = ref(false);
const showAddBlockMenu = ref(false);
const activeBlock = ref<any>(null);
const isSorting = ref(false);
const hoveredBlockId = ref<string | null>(null);
const activeSettingsTab = ref<string | undefined>(undefined);
const sidebarWidth = ref(380); // Default sidebar width (380px)
const sortableInstance = ref<InstanceType<typeof Sortable> | null>(null);
const pageBlocksWrapperRef = ref<HTMLElement | null>(null);
const isInitializingSortable = ref(false); // Prevent concurrent initialization
const previewRef = ref<HTMLElement | null>(null);

// Model value for the JSON page data
const pageData = defineModel<Record<string, any>>();

// Layout component - dynamically imported from page-builder directory
// Using shallowRef to avoid making the component reactive (performance optimization)
const pageLayout = shallowRef<Component | undefined>(undefined);

// Apply the sidebar width from the resize handle
function handleSidebarWidth(width: number) {
   sidebarWidth.value = width;
}

// Check if the page has settings
const hasPageSettings = computed(() => {
   // Show page settings if there are multiple layouts to choose from
   // Note: This computed might run before registry is initialized, so we check if layouts exist
   const layouts = getLayouts();
   if (Object.keys(layouts).length > 1) {
      return true;
   }

   // If the layout has settings
   if (pageData.value?.[props.settingsKey]) {
      if (Object.keys(pageData.value?.[props.settingsKey]).length > 0) {
         return true;
      }
   }

   return false;
});

function handleBlockClick(block: Block | null) {
   activeBlock.value = block;
   showPageSettings.value = false;
   hoveredBlockId.value = null;
   showAddBlockMenu.value = false;
}

async function handleAddBlock(blockType: string, insertIndex?: number) {
   if (!pageData.value) return;

   // Ensure blocks array exists
   if (!pageData.value[props.blocksKey]) {
      pageData.value[props.blocksKey] = [];
   }

   // Create a new block object
   const newBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: blockType,
      margin: props.defaultBlockMargin
         ? { top: props.defaultBlockMargin, bottom: props.defaultBlockMargin }
         : undefined,
   };
   // Get the default prop values from the block component
   const blockComponent = getBlockComponent(blockType);
   if (blockComponent?.props) {
      // loop props and set their default value
      Object.entries(blockComponent.props).forEach(([key, value]: [string, any]) => {
         if (value.default) {
            if (typeof value.default === "function") {
               newBlock[key as keyof typeof newBlock] = value.default();
            } else {
               newBlock[key as keyof typeof newBlock] = value.default;
            }
         }
      });
   }

   // Add the new block at the specified index or at the end
   if (insertIndex !== undefined) {
      pageData.value[props.blocksKey].splice(insertIndex, 0, newBlock);
   } else {
      pageData.value[props.blocksKey].push(newBlock);
      // Set the new block as active only when adding to the end (from EmptyState)
      activeBlock.value = newBlock;
      showAddBlockMenu.value = false;
   }

   return newBlock;
}

function setHoveredBlockId(id: string | null) {
   if (isSorting.value) return;
   hoveredBlockId.value = id;
}

// On escape key press
onKeyStroke("Escape", () => {
   // Unset active block
   activeBlock.value = null;
   hoveredBlockId.value = null;
   showAddBlockMenu.value = false;
   showPageSettings.value = false;
   activeSettingsTab.value = undefined;
});

// Click outside detection
onClickOutside(
   previewRef,
   () => {
      // Unset active block
      activeBlock.value = null;
      hoveredBlockId.value = null;
      showAddBlockMenu.value = false;
      showPageSettings.value = false;
      activeSettingsTab.value = undefined;
   },
   { ignore: ["#page-builder-sidebar", "#page-builder-resize-handle"] }
);

// Watch for the pageBlocksWrapperRef element to become available
watch(
   pageBlocksWrapperRef,
   async (element) => {
      if (element) {
         // Element is now in the DOM, initialize Sortable
         await nextTick(); // One more tick to ensure it's fully rendered
         await initSortable();
      }
   },
   { immediate: true }
);

// Also watch for both pageLayout and blocks array changes to trigger re-initialization
// But only if Sortable isn't already initialized or currently sorting
watch(
   () => [pageLayout.value, pageData.value?.[props.blocksKey]?.length],
   async ([layout, blockCount], [oldLayout, oldBlockCount]) => {
      // Skip if already initializing or sorting
      if (isInitializingSortable.value || isSorting.value) {
         return;
      }

      // Only initialize Sortable if both layout exists and blocks exist
      // And only if the layout changed or blocks were added/removed (not just reordered)
      const layoutChanged = layout !== oldLayout;
      const blocksChanged = blockCount !== oldBlockCount;
      const shouldInitialize = layout && blockCount && blockCount > 0 && !props.loading && pageBlocksWrapperRef.value;

      // Only re-initialize if layout changed or blocks were added/removed
      // Don't re-initialize on reorder (same count, just different order)
      if (shouldInitialize && (layoutChanged || blocksChanged || !sortableInstance.value)) {
         // Wait for the dynamic component to fully mount and render
         await nextTick();
         await nextTick();
         await initSortable();
      }
   },
   { immediate: false }
);

async function initSortable() {
   // Don't re-initialize if already sorting or initializing (prevents conflicts)
   if (isSorting.value || isInitializingSortable.value) {
      return;
   }

   // Check prerequisites before attempting to initialize
   if (props.loading) {
      console.warn("Cannot initialize Sortable: component is still loading");
      return;
   }

   if (!pageLayout.value) {
      console.warn("Cannot initialize Sortable: pageLayout is not set");
      return;
   }

   const blockCount = pageData.value?.[props.blocksKey]?.length;
   if (!blockCount || blockCount === 0) {
      console.warn("Cannot initialize Sortable: no blocks exist");
      return;
   }

   // Use the template ref first, fallback to getElementById
   const sortableBlocksWrapper = pageBlocksWrapperRef.value || document.getElementById("page-blocks-wrapper");

   if (!sortableBlocksWrapper) {
      console.warn("page-blocks-wrapper element not found. Conditions:", {
         loading: props.loading,
         hasPageLayout: !!pageLayout.value,
         blockCount: pageData.value?.[props.blocksKey]?.length,
         hasRef: !!pageBlocksWrapperRef.value,
         pagePreviewViewportExists: !!document.getElementById("page-viewport"),
      });
      return;
   }

   // If Sortable is already initialized and working, don't re-initialize
   if (sortableInstance.value) {
      // Check if the instance is still valid by checking if the element is still attached
      const { el } = sortableInstance.value;
      if (el && el.isConnected && el === sortableBlocksWrapper) {
         // Sortable is already initialized and valid, no need to re-initialize
         return;
      }
      // Instance exists but element is disconnected or different, destroy it
      try {
         sortableInstance.value.destroy();
      } catch {
         // Ignore errors during destruction
      }
      sortableInstance.value = null;
   }

   isInitializingSortable.value = true;
   try {
      sortableInstance.value = new Sortable(sortableBlocksWrapper, {
         animation: 150,
         ghostClass: "sortable-ghost",
         chosenClass: "sortable-chosen",
         dragClass: "sortable-drag",
         group: "page-blocks",
         forceFallback: false, // Use native HTML5 drag if available
         fallbackOnBody: true, // Append fallback element to body
         swapThreshold: 0.7, // Threshold for swap
         onStart: () => {
            isSorting.value = true;
         },
         onAdd: (event: any) => {
            // This fires when an item is added from another list (drag from sidebar)
            const { item: draggedElement, newIndex } = event;
            const blockType = draggedElement.getAttribute("data-block-type");

            if (blockType) {
               // Use the consolidated handleAddBlock function
               handleAddBlock(blockType, newIndex);

               // Remove the cloned HTML element that SortableJS added
               draggedElement.remove();

               // Force Vue to re-render by triggering reactivity
               nextTick(() => {
                  // The component will re-render with the new block data
               });
            }
         },
         onEnd: async (event: any) => {
            const { oldIndex, newIndex } = event;

            // Only handle reordering if this wasn't an add operation (oldIndex will be null for adds)
            if (
               oldIndex !== null &&
               oldIndex !== undefined &&
               newIndex !== null &&
               newIndex !== undefined &&
               oldIndex !== newIndex &&
               pageData.value?.[props.blocksKey]
            ) {
               // Wait for SortableJS to finish its DOM cleanup before we modify the array
               await nextTick();

               // Get the block data from the DOM element before Vue re-renders
               const movedBlock = pageData.value[props.blocksKey][oldIndex];
               if (movedBlock) {
                  // Update the array - this will trigger Vue to re-render
                  pageData.value[props.blocksKey].splice(oldIndex, 1);
                  pageData.value[props.blocksKey].splice(newIndex, 0, movedBlock);
               }
            }

            // Reset sorting state after a small delay to ensure DOM is stable
            await nextTick();
            isSorting.value = false;
         },
      });
   } finally {
      isInitializingSortable.value = false;
   }
}

onBeforeMount(async () => {
   // Initialize the registry first
   await initialiseRegistry();

   if (!pageData.value) {
      pageData.value = {};
   }

   if (!pageData.value?.[props.settingsKey]) {
      if (pageData.value) {
         pageData.value[props.settingsKey] = {};
      }
   }

   if (!pageData.value?.[props.settingsKey]?.layout) {
      if (pageData.value && pageData.value[props.settingsKey]) {
         pageData.value[props.settingsKey].layout = "default";
      }
   }

   // Sanitise the layout data (must be a valid layout name string)
   if (pageData.value?.[props.settingsKey]?.layout) {
      const layouts = getLayouts();
      const settings = pageData.value?.[props.settingsKey];
      if (settings) {
         if (typeof settings.layout !== "string") {
            settings.layout = "default";
         } else if (!layouts[settings.layout]) {
            settings.layout = "default";
         }
      }
   }

   if (!pageData.value?.[props.blocksKey]) {
      if (pageData.value) {
         pageData.value[props.blocksKey] = [];
      }
   }
});

// Initialize Sortable after component is mounted - watcher will handle the initialization
// This is just a fallback in case the watcher didn't fire
onMounted(async () => {
   await nextTick();
   // Trigger the watcher by checking conditions
   // The watcher will handle initialization if all conditions are met
   if (pageData.value?.[props.blocksKey]?.length && pageLayout.value && !props.loading) {
      await nextTick();
      await initSortable();
   }
});

function handleBlockReorder(oldIndex: number, newIndex: number) {
   if (!pageData.value?.[props.blocksKey]) return;

   const blocks = pageData.value[props.blocksKey];
   if (oldIndex < 0 || oldIndex >= blocks.length || newIndex < 0 || newIndex >= blocks.length) {
      return;
   }

   // Move block from oldIndex to newIndex
   const movedBlock = blocks[oldIndex];
   blocks.splice(oldIndex, 1);
   blocks.splice(newIndex, 0, movedBlock);
}

function handleBlockAdd(blockType: string, index: number) {
   // Use the existing handleAddBlock function
   handleAddBlock(blockType, index);
}

function handleClickPartial(partialValue: string) {
   const hasValue = partialValue !== null && partialValue !== "";

   // Show the settings sidebar when a partial is clicked
   showPageSettings.value = true;
   // Clear active block when clicking on a partial
   activeBlock.value = null;
   hoveredBlockId.value = null;
   showAddBlockMenu.value = false;

   // If partial has a value (e.g., "header"), set it as the active tab
   if (hasValue && partialValue) {
      activeSettingsTab.value = partialValue;
   } else {
      activeSettingsTab.value = undefined;
   }
}
</script>

<style lang="scss">
@use "../../assets/styles/mixins" as *;

$editor-background-color: #6a6a6a;

.wswg-json-editor {
   position: relative;
   width: 100%;
   max-width: 100vw;
   height: var(--editor-height);
   overflow-y: auto;

   &-loading {
      display: flex;
      align-items: center;
      justify-content: center;
   }

   &-body {
      display: flex;
      width: 100%;
      background-color: var(--editor-bg-color, $editor-background-color);
   }

   &-preview {
      position: relative;
      display: flex;
      flex: 1;
      flex-grow: 1;
      flex-shrink: 0;
      flex-direction: column;
      height: -webkit-fill-available;
      min-height: 0;
      padding: 1.5rem;
   }

   .page-builder-sidebar-wrapper {
      position: sticky;
      top: 0;
      z-index: 12;
      height: var(--editor-height);
      overflow-y: auto;
   }
}
</style>
