<template>
   <div
      id="page-builder-resize-handle"
      ref="resizeHandle"
      class="resize-handle shrink-0 cursor-col-resize transition-colors duration-200"
      @mousedown="startResize"
   ></div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { defineEmits } from "vue";

const emit = defineEmits<{
   (e: "sidebarWidth", width: number): void;
}>();

const resizeHandle = ref<HTMLElement | null>(null);
const sidebarWidth = ref(380); // Default sidebar width (380px)
const isResizing = ref(false);

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
</script>

<style scoped lang="scss">
/* Resize handle styles */
.resize-handle {
   position: relative;
   top: 0;
   right: 0;
   z-index: 2;
   width: 3px;
   height: 100%;
   cursor: col-resize;
   background-color: var(--grey-20);
   transition: all 0.2s ease-in-out;
}

.resize-handle:hover {
   width: 3px;
   background-color: var(--yellow-40);
}

.resize-handle:active {
   width: 3px;
   background-color: var(--yellow-50);
}

/* Add a subtle indicator when resizing */
.resize-handle::before {
   position: absolute;
   top: 50%;
   left: -6px;
   z-index: 20;
   width: 14px;
   height: 40px;
   content: "";
   background-color: var(--yellow-40);
   border-radius: var(--border-radius-16);
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
   background-color: var(--yellow-50);
   opacity: 1;
}
</style>
