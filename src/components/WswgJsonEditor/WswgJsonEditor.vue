<template>
   <div class="wswg-json-editor">
      <div class="wswg-json-editor-header">
         <!-- header slot for custom control elements -->
         <slot name="header">
            <!-- no default header content -->
         </slot>
         <!-- wswg toolbar-->
         <PageBuilderToolbar
            v-model:editorViewport="editorViewport"
            v-model:showPageSettings="showPageSettings"
            v-model:activeBlock="activeBlock"
            :hasPageSettings="hasPageSettings"
         >
            <slot name="toolbar">
               <!-- no default toolbar content -->
            </slot>
         </PageBuilderToolbar>
      </div>
      <slot v-if="loading" name="loading">
         <div class="wswg-json-editor-loading">
            <span>Loading...</span>
         </div>
      </slot>
      <!-- WYSIWYG editor -->
      <div v-else class="wswg-json-editor-body">
         <!-- Page preview -->
         <div class="wswg-json-editor-preview">
            <div
               class="mx-auto flex h-full flex-col transition-all duration-300"
               :class="{ 'w-full': editorViewport === 'desktop', 'w-96': editorViewport === 'mobile' }"
            >
               <BrowserNavigation v-if="showBrowserBar" class="browser-navigation-bar" :url="url" />
               <div
                  v-if="pageLayout"
                  id="page-preview-viewport"
                  class="overflow-hidden rounded-b-lg bg-white"
                  :class="{ 'rounded-t-lg': !showBrowserBar }"
               >
                  <component :is="pageLayout">
                     <template #default>
                        <!-- No blocks found -->
                        <EmptyState
                           v-if="!pageData[blocksKey]?.length"
                           v-model:showAddBlockMenu="showAddBlockMenu"
                           :editable="editable"
                           @block-added="handleAddBlock"
                        />
                        <!-- Blocks found -->
                        <div v-else id="page-blocks-wrapper">
                           <div v-for="(block, blockIndex) in pageData[blocksKey]" :key="block.id">
                              <BlockComponent
                                 :block="block"
                                 :blockIndex="blockIndex"
                                 :activeBlock="activeBlock"
                                 :editable="editable"
                                 :hoveredBlockId="hoveredBlockId"
                                 @hover-block="setHoveredBlockId"
                                 @click-block="handleBlockClick"
                              />
                           </div>
                        </div>
                     </template>
                  </component>
               </div>
               <p v-else>No layout component found</p>
            </div>
         </div>

         <!-- Resizable divider -->
         <ResizeHandle @sidebar-width="handleSidebarWidth" />

         <!-- Sidebar -->
         <PageBuilderSidebar
            v-model="pageData"
            v-model:activeBlock="activeBlock"
            v-model:hoveredBlockId="hoveredBlockId"
            v-model:showPageSettings="showPageSettings"
            v-model:showAddBlockMenu="showAddBlockMenu"
            :editable="editable"
            :blocksKey="blocksKey"
            :settingsKey="settingsKey"
            :style="{ width: sidebarWidth + 'px' }"
         />
      </div>
   </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, withDefaults, watch, type Component, onBeforeMount, nextTick, computed } from "vue";
import PageBuilderToolbar from "../PageBuilderToolbar/PageBuilderToolbar.vue";
import ResizeHandle from "../ResizeHandle/ResizeHandle.vue";
import PageBuilderSidebar from "../PageBuilderSidebar/PageBuilderSidebar.vue";
import BrowserNavigation from "../BrowserNavigation/BrowserNavigation.vue";
import BlockComponent from "../BlockComponent/BlockComponent.vue";
import EmptyState from "../EmptyState/EmptyState.vue";
import { getBlockComponent, getLayouts } from "../../util/registry";
import type { Block } from "../../types/Block";
import Sortable from "sortablejs";

const props = withDefaults(
   defineProps<{
      editable?: boolean;
      loading?: boolean;
      url?: string;
      showBrowserBar?: boolean;
      blocksKey?: string;
      settingsKey?: string;
      defaultBlockMargin?: "none" | "small" | "medium" | "large";
   }>(),
   {
      editable: false,
      loading: false,
      url: "",
      showBrowserBar: false,
      blocksKey: "blocks",
      settingsKey: "settings",
      defaultBlockMargin: "none",
   }
);

const editorViewport = ref<"desktop" | "mobile">("desktop");
const showPageSettings = ref(false);
const showAddBlockMenu = ref(false);
const activeBlock = ref<any>(null);
const isSorting = ref(false);
const hoveredBlockId = ref<string | null>(null);
const sidebarWidth = ref(380); // Default sidebar width (380px)

// Model value for the JSON page data
const pageData = defineModel<any>();

// Layout component - dynamically imported from page-builder directory
// Using shallowRef to avoid making the component reactive (performance optimization)
const pageLayout = shallowRef<Component | undefined>(undefined);

// Apply the sidebar width from the resize handle
function handleSidebarWidth(width: number) {
   sidebarWidth.value = width;
}

// Load layout component dynamically from @page-builder/layout/
async function loadLayout(layoutName: string | undefined) {
   // Use "default" layout if no layout is provided
   const layout = layoutName || "default";
   try {
      const availableLayouts = getLayouts();
      const layoutModule = availableLayouts[layout];
      pageLayout.value = layoutModule;
      await nextTick();
      initSortable();
   } catch (error) {
      // Layout doesn't exist, return undefined
      console.warn(`Layout "${layout}" not found in @page-builder/layout/`, error);
      pageLayout.value = undefined;
   }
}

// Check if the page has settings
const hasPageSettings = computed(() => {
   // Show page settings if there are multiple layouts to choose from
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

function handleAddBlock(blockType: string, insertIndex?: number) {
   // Ensure blocks array exists
   if (!pageData.value[props.blocksKey]) {
      pageData.value[props.blocksKey] = [];
   }

   // Record if this is an add from the EmptyState
   const isAddFromEmptyState = insertIndex === undefined;

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

   // finally, if this is an add from the EmptyState, we need to trigger a re-render and initialise the sortable
   if (isAddFromEmptyState) {
      nextTick(() => {
         // The component will re-render with the new block data
         initSortable();
      });
   }

   return newBlock;
}

function setHoveredBlockId(id: string | null) {
   if (isSorting.value) return;
   hoveredBlockId.value = id;
}

// Watch for changes in pageData layout and load the corresponding component
watch(
   () => pageData.value?.[props.settingsKey]?.layout,
   (layoutName) => {
      loadLayout(layoutName);
   },
   { immediate: true }
);

// Watch for activeBlock changes and scroll to the corresponding block in the preview
watch(
   () => activeBlock.value?.id,
   async (blockId) => {
      if (!blockId) return;

      // Wait for DOM to update
      await nextTick();

      // Find the block element by data-block-id
      const blockElement = document.querySelector(`[data-block-id="${blockId}"]`) as HTMLElement;
      if (!blockElement) return;

      // Scroll the block into view, centered in the scrollable container
      blockElement.scrollIntoView({
         behavior: "smooth",
         block: "center",
         inline: "nearest",
      });
   }
);

function initSortable() {
   const sortableBlocksWrapper = document.getElementById("page-blocks-wrapper");
   if (!sortableBlocksWrapper) return;
   new Sortable(sortableBlocksWrapper, {
      animation: 150,
      ghostClass: "sortable-ghost",
      chosenClass: "sortable-chosen",
      dragClass: "sortable-drag",
      group: "page-blocks",
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
      onEnd: (event: any) => {
         isSorting.value = false;
         const { oldIndex, newIndex } = event;

         // Only handle reordering if this wasn't an add operation (oldIndex will be null for adds)
         if (oldIndex !== null && oldIndex !== newIndex) {
            const movedBlock = pageData.value?.[props.blocksKey]?.splice(oldIndex, 1)[0];
            pageData.value?.[props.blocksKey]?.splice(newIndex, 0, movedBlock);
         }
      },
   });
}

onBeforeMount(() => {
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
</script>

<style lang="scss">
$editor-background-color: #6a6a6a;
.wswg-json-editor {
   display: flex;
   flex-direction: column;
   width: 100%;
   max-width: 100vw;
   height: 100%;
   min-height: 100vh;

   &-header {
      background-color: #fff;
      position: sticky;
      top: 0;
      z-index: 20;
   }

   &-loading {
      display: flex;
      align-items: center;
      justify-content: center;
   }

   &-body {
      display: flex;
      flex: 1;
      flex-grow: 1;
      width: 100%;
      flex-shrink: 0;
      min-height: 0;
      background-color: $editor-background-color;
   }

   &-preview {
      flex: 1;
      flex-grow: 1;
      flex-shrink: 0;
      min-height: 0;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      position: relative;

      .browser-navigation-bar {
         position: sticky;
         top: 80px;
         z-index: 12;
         &:before {
            content: "";
            position: absolute;
            top: -50%;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: $editor-background-color;
            z-index: -1;
         }
      }
   }
}
</style>
