<template>
   <div
      v-if="editable"
      class="relative p-5 py-12 text-center transition-all duration-200"
      :class="{ 'dropzone-active': isDraggingOver }"
      @dragover.prevent="handleDragOver"
      @dragenter.prevent="handleDragEnter"
      @dragleave="handleDragLeave"
      @drop.prevent="handleDrop"
   >
      <!-- Dropzone overlay -->
      <div
         v-if="isDraggingOver"
         class="absolute inset-0 z-10 flex items-center justify-center rounded-lg border-2 border-dashed border-blue-500 bg-blue-50/80 backdrop-blur-sm"
      >
         <div class="text-center">
            <p class="text-lg font-semibold text-blue-700">Drop block here</p>
            <p class="mt-1 text-sm text-blue-600">Release to add your first block</p>
         </div>
      </div>

      <h2 class="mb-3 text-xl font-bold">No blocks found</h2>
      <template v-if="editable">
         <p
            class="mb-9 inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-500"
         >
            Add a block to get started
         </p>
      </template>
      <!-- empty state image from assets -->
      <img :src="emptyStateImage" alt="Empty state" class="mx-auto h-auto w-full max-w-xs" />
   </div>
   <div v-else class="p-5 py-12 text-center">
      <h2 class="mb-3 text-xl font-bold">No blocks found</h2>
      <!-- empty state image from assets -->
      <img :src="emptyStateImage" alt="Empty state" class="mx-auto h-auto w-full max-w-xs" />
   </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import emptyStateImage from "../../assets/images/empty-state.jpg";

const isDraggingOver = ref(false);
const emit = defineEmits<{
   (e: "blockAdded", blockType: string): void;
}>();

defineProps<{
   editable: boolean;
}>();

function handleDragOver(event: DragEvent) {
   if (!event.dataTransfer) return;
   event.dataTransfer.dropEffect = "move";
   isDraggingOver.value = true;
}

function handleDragEnter(event: DragEvent) {
   if (!event.dataTransfer) return;
   event.dataTransfer.dropEffect = "move";
   isDraggingOver.value = true;
}

function handleDragLeave(event: DragEvent) {
   const relatedTarget = event.relatedTarget as HTMLElement | null;
   const currentTarget = event.currentTarget as HTMLElement | null;

   if (!currentTarget?.contains(relatedTarget)) {
      isDraggingOver.value = false;
   }
}

function handleDrop(event: DragEvent) {
   isDraggingOver.value = false;

   if (!event.dataTransfer) return;

   // Get block type from dataTransfer
   const blockType = event.dataTransfer.getData("block-type");
   if (blockType) {
      emit("blockAdded", blockType);
   }
}
</script>
