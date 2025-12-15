<template>
   <div
      id="page-viewport"
      ref="editorRef"
      class="page-renderer-wrapper relative"
      :class="{ 'settings-open': settingsOpen }"
   >
      <template v-if="isReady">
         <component :is="layoutComponent" v-if="layoutComponent" v-bind="settings" :blocks="blocks">
            <template #default>
               <!-- No blocks found -->
               <EmptyState v-if="!blocks?.length" :editable="editable" @block-added="handleBlockAdded" />
               <!-- Blocks found -->
               <div
                  v-else
                  id="page-blocks-wrapper"
                  ref="pageBlocksWrapperRef"
                  class="relative"
                  :class="{ 'drag-over': isDraggingOver }"
                  @dragenter="handleDragEnter"
                  @dragleave="handleDragLeave"
                  @dragover="handleDragOver"
                  @drop="handleDrop"
               >
                  <!-- Drop indicator - positioned absolutely based on calculated position -->
                  <div
                     v-if="isDraggingOver && dropInsertIndex !== null && dropIndicatorTop !== null"
                     class="drop-indicator"
                     :style="{ top: dropIndicatorTop + 'px' }"
                  >
                     <div class="drop-indicator-line"></div>
                     <div class="drop-indicator-label">Drop here</div>
                     <div class="drop-indicator-line"></div>
                  </div>

                  <template v-for="(block, blockIndex) in blocks" :key="block.id">
                     <div>
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
                  </template>
               </div>
            </template>
         </component>
         <!-- No layout found -->
         <div v-else class="rounded-b-lg bg-white px-5 py-12 md:py-20">
            <div class="mx-auto max-w-md pb-7 text-center">
               <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="mx-auto size-20 text-gray-400"
               >
                  <path
                     stroke-linecap="round"
                     stroke-linejoin="round"
                     d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                  ></path>
               </svg>

               <h2 class="text-2xl font-bold text-gray-900">No layout found</h2>

               <p class="mt-4 text-pretty text-gray-700">
                  Get started by creating your first layout. It only takes a few seconds.
               </p>

               <p class="mt-6 text-sm text-gray-700">
                  <a href="#" class="underline hover:text-gray-900">Learn how</a> or
                  <a href="#" class="underline hover:text-gray-900">view examples</a>
               </p>
            </div>
         </div>
      </template>
   </div>
</template>

<script setup lang="ts">
import { computed, withDefaults, onBeforeMount, ref, onBeforeUnmount, onMounted, watch, nextTick } from "vue";
import { initialiseRegistry, getLayout } from "../../util/theme-registry";
import BlockComponent from "../BlockComponent/BlockComponent.vue";
import EmptyState from "../EmptyState/EmptyState.vue";
import type { Block } from "../../types/Block";
import type { PartialClickMessage } from "../IframePreview/types";
import Sortable from "sortablejs";

const props = withDefaults(
   defineProps<{
      blocks: Block[];
      layout?: string;
      settings?: Record<string, any>;
      activeBlock?: Block | null;
      hoveredBlockId?: string | null;
      editable?: boolean;
      settingsOpen?: boolean;
      theme?: string;
   }>(),
   {
      layout: "default",
      settings: () => ({}),
      activeBlock: null,
      hoveredBlockId: null,
      editable: false,
      settingsOpen: false,
      theme: "default",
   }
);

const isReady = ref(false);
const editorRef = ref<HTMLElement | null>(null);
const isSorting = ref(false);
const sortableInstance = ref<InstanceType<typeof Sortable> | null>(null);
const isInitializingSortable = ref(false);

// Get the layout component based on the layout prop
// Only compute when isReady is true (registry is initialized)
const layoutComponent = computed(() => {
   if (!isReady.value) {
      return undefined;
   }
   return getLayout(props.layout);
});

function handleBlockClick(block: Block | null) {
   sendToParent({
      type: "BLOCK_CLICK",
      block: block,
   });
}

function setHoveredBlockId(blockId: string | null) {
   sendToParent({
      type: "BLOCK_HOVER",
      blockId: blockId,
   });
}

function handleBlockAdded(blockType: string) {
   sendToParent({
      type: "BLOCK_ADD",
      blockType: blockType,
   });
}

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
   } else {
      console.error("[iframe] No parent window found");
   }
}

/** PARTIALS HANDLING */
// Handle clicks on elements with data-partial attribute
let dataPartialClickHandler: ((event: Event) => void) | null = null;

function setupDataPartialClickHandler() {
   if (!editorRef.value) {
      console.error("[iframe] EditorPageRenderer: No editor reference found");
      return;
   }

   dataPartialClickHandler = (event: Event) => {
      const target = event.target as HTMLElement;
      const partialElement = target.closest("[data-partial]") as HTMLElement | null;

      if (partialElement) {
         sendToParent({
            type: "CLICK_PARTIAL",
            partial: partialElement.getAttribute("data-partial"),
         } as PartialClickMessage);
      }
   };

   editorRef.value.addEventListener("click", dataPartialClickHandler);
}

/** SORTABLE HANDLING */
const pageBlocksWrapperRef = ref<HTMLElement | null>(null);

/** DRAG AND DROP HANDLING - Cross-iframe drag support */
const isDraggingOver = ref(false);
const dropInsertIndex = ref<number | null>(null);
const dropIndicatorTop = ref<number | null>(null);

function handleDragEnter(event: DragEvent) {
   // Skip if SortableJS is handling the drag (reordering existing blocks)
   if (isSorting.value) {
      return;
   }

   // Check if SortableJS is dragging (has sortable drag element)
   const dragSource = document.querySelector(".sortable-drag, .sortable-ghost");
   if (dragSource) {
      // SortableJS is handling this drag, don't interfere
      return;
   }

   // Check if this is a new block drag from sidebar (has block-type data)
   if (event.dataTransfer?.types.includes("block-type")) {
      isDraggingOver.value = true;
      event.preventDefault();
      event.stopPropagation();
   }
}

function handleDragLeave(event: DragEvent) {
   // Skip if SortableJS is handling the drag
   if (isSorting.value) {
      return;
   }

   const relatedTarget = event.relatedTarget as HTMLElement | null;
   const currentTarget = event.currentTarget as HTMLElement | null;

   // Only hide if we're actually leaving the drop zone
   if (!currentTarget?.contains(relatedTarget)) {
      isDraggingOver.value = false;
      dropInsertIndex.value = null;
      dropIndicatorTop.value = null;
   }
}

function handleDragOver(event: DragEvent) {
   // Skip if SortableJS is handling the drag (reordering existing blocks)
   if (isSorting.value) {
      return;
   }

   // Check if drag source is from within blocks wrapper (existing block being reordered)
   const dragSource = document.querySelector(".sortable-drag, .sortable-ghost");
   if (dragSource) {
      // SortableJS is handling this drag, don't interfere
      return;
   }

   // Check if this is a new block drag from sidebar (has block-type data)
   if (!event.dataTransfer?.types.includes("block-type")) {
      return;
   }

   // Allow drop
   event.preventDefault();
   event.stopPropagation();
   if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "move";
   }

   // Calculate insertion position
   if (!props.blocks || props.blocks.length === 0) {
      dropInsertIndex.value = 0;
      dropIndicatorTop.value = 0;
      return;
   }

   const dropTarget = event.target as HTMLElement;
   const blockElement = dropTarget.closest("[data-block-id]");
   const wrapperElement = pageBlocksWrapperRef.value;

   if (!wrapperElement) return;

   if (blockElement) {
      const blockId = blockElement.getAttribute("data-block-id");
      if (blockId) {
         const currentIndex = props.blocks.findIndex((b) => b.id === blockId);
         if (currentIndex !== -1) {
            // Determine if we should insert before or after based on mouse position
            const blockRect = blockElement.getBoundingClientRect();
            const wrapperRect = wrapperElement.getBoundingClientRect();
            const mouseY = event.clientY;
            const blockCenterY = blockRect.top + blockRect.height / 2;

            if (mouseY < blockCenterY) {
               // Insert before this block
               dropInsertIndex.value = currentIndex;
               dropIndicatorTop.value = blockRect.top - wrapperRect.top - 2;
            } else {
               // Insert after this block
               dropInsertIndex.value = currentIndex + 1;
               dropIndicatorTop.value = blockRect.bottom - wrapperRect.top - 2;
            }
         }
      }
   } else {
      // Dragging over empty area - append to end
      dropInsertIndex.value = props.blocks.length;
      // Calculate position at the bottom of the wrapper
      const wrapperRect = wrapperElement.getBoundingClientRect();
      dropIndicatorTop.value = wrapperRect.height - 2;
   }
}

function handleDrop(event: DragEvent) {
   // Skip if SortableJS is handling the drop (reordering existing blocks)
   if (isSorting.value) {
      return;
   }

   // Check if this is a SortableJS drop (has sortable drag element)
   const dragSource = document.querySelector(".sortable-drag, .sortable-ghost");
   if (dragSource) {
      // SortableJS is handling this drop, don't interfere
      return;
   }

   // Check if this is a new block drag from sidebar (has block-type data)
   if (!event.dataTransfer?.types.includes("block-type")) {
      return;
   }

   event.preventDefault();
   event.stopPropagation();

   if (!event.dataTransfer) {
      // Reset drag state
      isDraggingOver.value = false;
      dropInsertIndex.value = null;
      dropIndicatorTop.value = null;
      return;
   }

   // Get block type from dataTransfer (set by AddBlockItem)
   const blockType = event.dataTransfer.getData("block-type") || event.dataTransfer.getData("text/plain");

   if (!blockType) {
      // Reset drag state
      isDraggingOver.value = false;
      dropInsertIndex.value = null;
      dropIndicatorTop.value = null;
      return;
   }

   // Calculate insertion position based on drop event (don't rely on stale dropInsertIndex)
   let insertIndex: number;

   if (!props.blocks || props.blocks.length === 0) {
      insertIndex = 0;
   } else {
      const dropTarget = event.target as HTMLElement;
      const blockElement = dropTarget.closest("[data-block-id]");

      if (blockElement) {
         const blockId = blockElement.getAttribute("data-block-id");
         if (blockId) {
            const currentIndex = props.blocks.findIndex((b) => b.id === blockId);
            if (currentIndex !== -1) {
               // Determine if we should insert before or after based on mouse position
               const blockRect = blockElement.getBoundingClientRect();
               const mouseY = event.clientY;
               const blockCenterY = blockRect.top + blockRect.height / 2;
               insertIndex = mouseY < blockCenterY ? currentIndex : currentIndex + 1;
            } else {
               insertIndex = props.blocks.length;
            }
         } else {
            insertIndex = props.blocks.length;
         }
      } else {
         // Dropped in empty area - append to end
         insertIndex = props.blocks.length;
      }
   }

   // Reset drag state
   isDraggingOver.value = false;
   dropInsertIndex.value = null;
   dropIndicatorTop.value = null;

   // Send message to parent to add the block
   sendToParent({
      type: "BLOCK_ADD",
      blockType: blockType,
      index: insertIndex,
   });
}

async function initSortable() {
   // Don't re-initialize if already sorting or initializing (prevents conflicts)
   if (isSorting.value || isInitializingSortable.value) {
      return;
   }

   if (!layoutComponent.value) {
      console.warn("Cannot initialize Sortable: layout component is not set");
      return;
   }

   const blockCount = props.blocks?.length;
   if (!blockCount || blockCount === 0) {
      console.warn("Cannot initialize Sortable: no blocks exist");
      return;
   }

   // Use the template ref first, fallback to getElementById
   const sortableBlocksWrapper = pageBlocksWrapperRef.value || document.getElementById("page-blocks-wrapper");

   if (!sortableBlocksWrapper) {
      console.warn("page-blocks-wrapper element not found. Conditions:", {
         hasLayout: !!layoutComponent.value,
         blockCount: props.blocks?.length,
         hasRef: !!pageBlocksWrapperRef.value,
         pageViewportExists: !!document.getElementById("page-viewport"),
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
               // Send message to parent to handle block addition
               sendToParent({
                  type: "BLOCK_ADD",
                  blockType: blockType,
                  index: newIndex,
               });

               // Remove the cloned HTML element that SortableJS added
               draggedElement.remove();
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
               oldIndex !== newIndex
            ) {
               // Send message to parent to handle block reordering
               sendToParent({
                  type: "BLOCK_REORDER",
                  oldIndex: oldIndex,
                  newIndex: newIndex,
               });
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
   isReady.value = false;

   // Initialise registries for editor preview
   // Exclude the editing registry to load only the theme and blocks
   await initialiseRegistry(props.theme, false);

   isReady.value = true;

   setupDataPartialClickHandler();
});

// Watch for blocks and layout changes to initialize Sortable
watch(
   [() => props.blocks, () => layoutComponent.value, () => isReady.value],
   async ([blocks, layout, ready]) => {
      if (ready && layout && blocks && blocks.length > 0) {
         await nextTick();
         await initSortable();
      }
   },
   { immediate: true }
);

onMounted(async () => {
   // Initialize Sortable after component is mounted
   if (props.blocks && props.blocks.length > 0 && layoutComponent.value && isReady.value) {
      await nextTick();
      await initSortable();
   }
});

// Cleanup event listener and Sortable instance on unmount
onBeforeUnmount(() => {
   if (dataPartialClickHandler && editorRef.value) {
      editorRef.value.removeEventListener("click", dataPartialClickHandler);
      dataPartialClickHandler = null;
   }

   // Destroy Sortable instance
   if (sortableInstance.value) {
      try {
         sortableInstance.value.destroy();
      } catch {
         // Ignore errors during destruction
      }
      sortableInstance.value = null;
   }
});
</script>

<style scoped lang="scss">
@use "../../assets/styles/mixins" as *;

.block-wrapper {
   @include block-margin-classes;
}

// target elements any data-partial="header" or empty data-partial attribute
:deep([data-partial]) {
   &:hover {
      @include overlay-apply(
         var(--partial-backdrop-color),
         var(--partial-border-color),
         var(--partial-border-width),
         var(--partial-border-style)
      );
   }

   cursor: pointer;
}

// When settings sidebar is open, show overlay on all partial elements using active color
.settings-open {
   :deep([data-partial]) {
      @include overlay-apply(
         var(--partial-backdrop-color),
         var(--partial-border-color),
         var(--partial-border-width),
         var(--partial-border-style)
      );
   }
}

#page-blocks-wrapper {
   position: relative;

   &.drag-over {
      min-height: 100px;
   }
}

.drop-indicator {
   position: absolute;
   right: 0;
   left: 0;
   z-index: 1000;
   display: flex;
   gap: 0.2rem;
   align-items: center;
   width: 100%;
   pointer-events: none;
   transform: translateY(calc(var(--block-border-width, 4px) * -2));
   animation: drop-indicator-pulse 1.5s ease-in-out infinite;
}

.drop-indicator-line {
   flex: 1;
   height: 3px;
   background: var(--block-border-color, #638ef1);
}

.drop-indicator-label {
   padding: 0.25rem 0.75rem;
   font-size: 0.75rem;
   font-weight: 600;
   color: white;
   white-space: nowrap;
   background: var(--block-border-color, #638ef1);
   border-radius: 0.375rem;
}

@keyframes drop-indicator-pulse {
   0%,
   100% {
      opacity: 1;
   }

   50% {
      opacity: 0.7;
   }
}
</style>
