<template>
   <div
      :data-block-type="block.type"
      draggable="true"
      class="cursor-pointer rounded-md border border-gray-300 bg-zinc-50 p-2 text-sm text-zinc-900 hover:border-zinc-400 hover:text-zinc-900"
      @dragstart="(event) => handleDragStart(event, block)"
   >
      <!-- thumbnail image -->
      <div v-if="thumbnailUrl" class="w-full overflow-hidden rounded-md bg-neutral-100">
         <img
            :src="thumbnailUrl"
            :alt="block.label || block.type"
            class="mx-auto mb-2 h-28 w-auto object-contain"
            @error="thumbnailError = true"
         />
      </div>
      <!-- emoji -->
      <div v-else-if="block.emoji" class="mb-2 flex h-28 w-full items-center justify-center rounded-md bg-zinc-200">
         <span class="text-2xl">{{ block.emoji }}</span>
      </div>
      <!-- placeholder -->
      <div v-else class="mb-2 flex h-28 w-full items-center justify-center rounded-md bg-zinc-200">
         <CubeTransparentIcon class="size-6 text-zinc-400" />
      </div>
      <p class="text-sm">{{ block.label }}</p>
   </div>
</template>

<script setup lang="ts">
import { computed, defineProps, ref } from "vue";
import type { Block } from "../../types/Block";
import { getBlockThumbnailUrl } from "../../util/registry";
import { CubeTransparentIcon } from "@heroicons/vue/24/outline";

const props = defineProps<{
   block: Block;
}>();

const thumbnailError = ref<boolean>(false);
const thumbnailUrl = computed(() => {
   return getBlockThumbnailUrl(props.block.directory);
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
