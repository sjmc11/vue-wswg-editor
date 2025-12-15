<template>
   <div class="wswg-page-builder" :class="{ 'settings-open': showPageSettings }">
      <slot v-if="loading || themeLoading" name="loading">
         <div class="wswg-page-builder-loading flex h-full flex-col items-center justify-center gap-4">
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
      <div v-else class="wswg-page-builder-body">
         <!-- Page preview -->
         <div class="wswg-page-builder-preview overflow-y-auto">
            <div
               id="page-preview-container"
               class="mx-auto flex flex-col overflow-hidden rounded-lg bg-white transition-all duration-300"
               style="height: -webkit-fill-available"
               :class="{ 'w-full': editorViewport === 'desktop', 'w-96': editorViewport === 'mobile' }"
            >
               <BrowserNavigation v-if="showBrowserBar" class="browser-navigation-bar" :url="url" />
               <IframePreview
                  ref="previewRef"
                  :pageData="pageData"
                  :activeBlock="activeBlock"
                  :hoveredBlockId="hoveredBlockId"
                  :viewport="editorViewport"
                  :editable="editable"
                  :blocksKey="blocksKey"
                  :settingsKey="settingsKey"
                  :settingsOpen="showPageSettings"
                  :theme="theme"
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
import { ref, withDefaults, onBeforeMount, computed, watch } from "vue";
import ResizeHandle from "../ResizeHandle/ResizeHandle.vue";
import PageBuilderSidebar from "../PageBuilderSidebar/PageBuilderSidebar.vue";
import BrowserNavigation from "../BrowserNavigation/BrowserNavigation.vue";
import IframePreview from "../IframePreview/IframePreview.vue";
import { initialiseRegistry, getBlock, themeLayouts } from "../../util/theme-registry";
import type { Block } from "../../types/Block";
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
      theme?: string;
   }>(),
   {
      editable: false,
      loading: false,
      url: "",
      showBrowserBar: false,
      blocksKey: "blocks",
      settingsKey: "settings",
      defaultBlockMargin: "none",
      theme: "default",
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
const previewRef = ref<HTMLElement | null>(null);
const themeLoading = ref(false);

// Model value for the JSON page data
const pageData = defineModel<Record<string, any>>();

// Apply the sidebar width from the resize handle
function handleSidebarWidth(width: number) {
   sidebarWidth.value = width;
}

// Check if the page has settings
const hasPageSettings = computed(() => {
   // Show page settings if there are multiple layouts to choose from
   // Note: This computed might run before registry is initialized, so we check if layouts exist
   if (Object.keys(themeLayouts).length > 1) {
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
   const blockComponent = getBlock(blockType);
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
   }

   // Set the new block as active only when adding to the end (from EmptyState)
   activeBlock.value = newBlock;
   showAddBlockMenu.value = false;

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

onBeforeMount(async () => {
   // Initialise the registry with the active theme
   // Include the editing registry to load additional theme fields and thumbnails
   await initialiseRegistry(props.theme, true);

   // Initialise the page data if not present
   if (!pageData.value) {
      pageData.value = {};
   }

   // Initialise settings value if not present
   if (!pageData.value?.[props.settingsKey]) {
      if (pageData.value) {
         pageData.value[props.settingsKey] = {};
      }
   }

   // Set the default layout if not present
   if (!pageData.value?.[props.settingsKey]?.layout) {
      const settings = pageData.value?.[props.settingsKey];
      if (settings) {
         if (typeof settings.layout !== "string") {
            settings.layout = "default";
         }
      }
   }

   // Sanitise the layout data (must be a valid layout name string)
   if (pageData.value?.[props.settingsKey]?.layout) {
      const settings = pageData.value?.[props.settingsKey];
      if (settings) {
         if (typeof settings.layout !== "string") {
            settings.layout = "default";
         } else if (!themeLayouts.value[settings.layout]) {
            settings.layout = "default";
         }
      }
   }

   // Set a default blocks array if not present
   if (!pageData.value?.[props.blocksKey]) {
      if (pageData.value) {
         pageData.value[props.blocksKey] = [];
      }
   }
});

// Watch for theme changes to re-initialize the registry
watch(
   () => props.theme,
   async (newTheme) => {
      themeLoading.value = true;
      await initialiseRegistry(newTheme, true);
      themeLoading.value = false;
   }
);

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

.wswg-page-builder {
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
