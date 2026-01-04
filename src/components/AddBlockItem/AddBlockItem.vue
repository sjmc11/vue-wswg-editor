<template>
   <div
      :data-block-type="block.type"
      draggable="true"
      class="add-block-item"
      @dragstart="(event) => handleDragStart(event, block)"
   >
      <!-- thumbnail image -->
      <div v-if="thumbnailUrl" class="add-block-item__thumbnail">
         <img
            :src="thumbnailUrl"
            :alt="block.label || block.type"
            class="add-block-item__image"
            @error="thumbnailError = true"
         />
      </div>
      <!-- emoji -->
      <div v-else-if="block.emoji" class="add-block-item__emoji">
         <span class="add-block-item__emoji-text">{{ block.emoji }}</span>
      </div>
      <!-- placeholder -->
      <div v-else class="add-block-item__placeholder">
         <CubeTransparentIcon class="add-block-item__placeholder-icon" />
      </div>
      <p class="add-block-item__label">{{ block.label }}</p>
   </div>
</template>

<script setup lang="ts">
import { computed, defineProps, ref } from "vue";
import type { Block } from "../../types/Block";
import { getBlockThumbnail } from "../../util/theme-registry";
import { CubeTransparentIcon } from "@heroicons/vue/24/outline";

const props = defineProps<{
   block: Block;
}>();

const thumbnailError = ref<boolean>(false);
const thumbnailUrl = computed(() => {
   return getBlockThumbnail(props.block.path);
});

function handleDragStart(event: DragEvent, block: Block) {
   if (!event.dataTransfer) return;
   // Store the block type in dataTransfer (use block.type as fallback if __name not available)
   const blockType = block.__name || block.type;
   event.dataTransfer.setData("block-type", blockType);
   event.dataTransfer.effectAllowed = "move";
   // Allow dragging to iframes
   event.dataTransfer.setData("text/plain", blockType);

   // Check if the dragged element has data-prevent-drop attribute
   const draggedElement = event.target as HTMLElement;
   if (draggedElement?.hasAttribute("data-prevent-drop")) {
      event.dataTransfer.setData("prevent-drop", "true");
   }
}
</script>

<style scoped lang="scss">
.add-block-item {
   padding: 0.5rem;
   font-size: 0.875rem;
   color: #18181b;
   cursor: pointer;
   border: 1px solid #d1d5db;
   border-radius: 0.375rem;
   background-color: #fafafa;
   transition: all 0.15s ease-in-out;

   &:hover {
      color: #18181b;
      border-color: #a1a1aa;
   }

   &__thumbnail {
      width: 100%;
      overflow: hidden;
      border-radius: 0.375rem;
      background-color: #f5f5f5;
   }

   &__image {
      display: block;
      width: auto;
      height: 7rem;
      margin-left: auto;
      margin-right: auto;
      margin-bottom: 0.5rem;
      object-fit: contain;
   }

   &__emoji {
      display: flex;
      width: 100%;
      height: 7rem;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.5rem;
      border-radius: 0.375rem;
      background-color: #e4e4e7;
   }

   &__emoji-text {
      font-size: 1.5rem;
   }

   &__placeholder {
      display: flex;
      width: 100%;
      height: 7rem;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.5rem;
      border-radius: 0.375rem;
      background-color: #e4e4e7;
   }

   &__placeholder-icon {
      width: 1.5rem;
      height: 1.5rem;
      color: #a1a1aa;
   }

   &__label {
      font-size: 0.875rem;
   }
}
</style>
