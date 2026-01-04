<template>
   <div
      v-if="editable"
      class="empty-state"
      :class="{ 'empty-state--dragging': isDraggingOver }"
      @dragover.prevent="handleDragOver"
      @dragenter.prevent="handleDragEnter"
      @dragleave="handleDragLeave"
      @drop.prevent="handleDrop"
   >
      <!-- Dropzone overlay -->
      <div v-if="isDraggingOver" class="empty-state__dropzone">
         <div class="empty-state__dropzone-content">
            <p class="empty-state__dropzone-title">Drop block here</p>
            <p class="empty-state__dropzone-subtitle">Release to add your first block</p>
         </div>
      </div>

      <h2 class="empty-state__title">No blocks found</h2>
      <template v-if="editable">
         <p class="empty-state__message">Add a block to get started</p>
      </template>
      <!-- empty state image from assets -->
      <img :src="emptyStateImage" alt="Empty state" class="empty-state__image" />
   </div>
   <div v-else class="empty-state">
      <h2 class="empty-state__title">No blocks found</h2>
      <!-- empty state image from assets -->
      <img :src="emptyStateImage" alt="Empty state" class="empty-state__image" />
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

<style scoped lang="scss">
.empty-state {
   position: relative;
   padding: 1.25rem;
   padding-top: 3rem;
   padding-bottom: 3rem;
   text-align: center;
   transition: all 0.2s ease-in-out;

   &__title {
      margin-bottom: 0.75rem;
      font-size: 1.25rem;
      font-weight: 700;
   }

   &__message {
      display: inline-flex;
      gap: 0.375rem;
      align-items: center;
      margin-bottom: 2.25rem;
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
      color: #71717a;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      background-color: #fafafa;
   }

   &__image {
      display: block;
      width: 100%;
      max-width: 20rem;
      height: auto;
      margin-left: auto;
      margin-right: auto;
   }

   &__dropzone {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px dashed #3b82f6;
      border-radius: 0.5rem;
      background-color: rgb(239 246 255 / 80%);
      backdrop-filter: blur(4px);
   }

   &__dropzone-content {
      text-align: center;
   }

   &__dropzone-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1d4ed8;
   }

   &__dropzone-subtitle {
      margin-top: 0.25rem;
      font-size: 0.875rem;
      color: #2563eb;
   }
}
</style>
