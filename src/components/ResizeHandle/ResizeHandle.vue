<template>
   <div class="resize-handle-wrapper">
      <div
         id="page-builder-resize-handle"
         ref="resizeHandle"
         class="resize-handle"
         @mousedown="startResize"
      ></div>
      <span class="viewport-size">
         <span class="viewport-size__badge">
            {{ computedViewportSize }}
         </span>
      </span>
   </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";

const emit = defineEmits<{
   (e: "sidebarWidth", width: number): void;
}>();

const resizeHandle = ref<HTMLElement | null>(null);
const sidebarWidth = ref(380); // Default sidebar width (380px)
const isResizing = ref(false);
const viewportWidth = ref<number>(0);
let resizeObserver: ResizeObserver | null = null;
let updateViewportWidthFn: (() => void) | null = null;

// Resize functionality
function startResize(event: MouseEvent) {
   isResizing.value = true;
   event.preventDefault();

   const startX = event.clientX;
   const startSidebarWidth = sidebarWidth.value;

   function handleMouseMove(event: MouseEvent) {
      if (!isResizing.value) return;

      const deltaX = event.clientX - startX;
      const newSidebarWidth = Math.max(300, Math.min(800, startSidebarWidth - deltaX)); // Min 300px, Max 800px

      sidebarWidth.value = newSidebarWidth;
      emit("sidebarWidth", newSidebarWidth);
   }

   function handleMouseUp() {
      isResizing.value = false;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
   }

   document.addEventListener("mousemove", handleMouseMove);
   document.addEventListener("mouseup", handleMouseUp);
   document.body.style.cursor = "col-resize";
   document.body.style.userSelect = "none";
}

// Calculate viewport width based on #page-viewport element
const computedViewportSize = computed(() => {
   return viewportWidth.value > 0 ? `${viewportWidth.value}px` : "0px";
});

// Setup ResizeObserver to watch #page-viewport element
onMounted(() => {
   updateViewportWidthFn = () => {
      const viewportElement = document.getElementById("page-preview-container");
      if (viewportElement) {
         viewportWidth.value = viewportElement.offsetWidth;
      }
   };

   // Initial measurement
   updateViewportWidthFn();

   // Use ResizeObserver to watch for size changes
   const viewportElement = document.getElementById("page-preview-container");
   if (viewportElement) {
      resizeObserver = new ResizeObserver(() => {
         if (updateViewportWidthFn) {
            updateViewportWidthFn();
         }
      });
      resizeObserver.observe(viewportElement);
   }

   // Also listen for window resize events as a fallback
   window.addEventListener("resize", updateViewportWidthFn);
});

onBeforeUnmount(() => {
   if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
   }
   if (updateViewportWidthFn) {
      window.removeEventListener("resize", updateViewportWidthFn);
      updateViewportWidthFn = null;
   }
});
</script>

<style scoped lang="scss">
/* Resize handle styles */
.resize-handle-wrapper {
   position: sticky;
   top: 0;
   right: 0;
   z-index: 30;
   height: var(--editor-height);

   &:hover .viewport-size {
      opacity: 1;
   }
}

.resize-handle {
   flex-shrink: 0;
   width: 3px;
   height: var(--editor-height);
   cursor: col-resize;
   background-color: #dbdee0;
   transition: all 0.2s ease-in-out;
}

.viewport-size {
   position: absolute;
   top: 0.25rem;
   right: 0.25rem;
   opacity: 0;
   transition: opacity 0.2s ease-in-out;

   &__badge {
      display: block;
      padding: 0.25rem 0.375rem;
      border-radius: 0.125rem;
      background-color: #facc15;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 0.75rem;
      font-weight: 500;
      color: #111827;
   }
}

.resize-handle:hover {
   width: 3px;
   background-color: #fcd34d;
}

.resize-handle:active {
   width: 3px;
   background-color: #fbbf24;
}

/* Add a subtle indicator when resizing */
.resize-handle::before {
   position: absolute;
   top: 50%;
   left: -6px;
   z-index: 50;
   width: 14px;
   height: 40px;
   content: "";
   background-color: #fcd34d;
   border-radius: 8px;
   opacity: 0;
   transform: translateY(-50%);
   transition:
      opacity 0.2s ease-in-out,
      background-color 0.2s ease-in-out;
}

.resize-handle:hover::before {
   opacity: 1;
}

.resize-handle:active::before {
   background-color: #fbbf24;
   opacity: 1;
}
</style>
