<template>
   <div
      :data-block-type="toCamelCase(block.__name)"
      draggable="true"
      class="cursor-pointer rounded-md border bg-zinc-50 p-3 text-sm text-zinc-900 hover:border-zinc-400 hover:text-zinc-900"
      @dragstart="(event) => handleDragStart(event, block)"
   >
      <!-- thumbnail image -->
      <img
         v-if="thumbnailUrl && !thumbnailError"
         :src="thumbnailUrl"
         :alt="block.label || block.name"
         class="h-46 mb-2 w-full rounded-md bg-zinc-200 object-cover"
         @error="thumbnailError = true"
      />
      <!-- icon -->
      <div v-else-if="block.icon" class="mb-2 flex h-24 w-full items-center justify-center rounded-md bg-zinc-200">
         <span>Icon: {{ block.icon }}</span>
      </div>
      <!-- placeholder -->
      <div v-else class="mb-2 flex h-24 w-full items-center justify-center rounded-md bg-zinc-200">
         <span>Placeholder</span>
      </div>
      <p class="font-bold">{{ block.label }}</p>
   </div>
</template>

<script setup lang="ts">
import { computed, defineProps, ref } from "vue";
import { type Block, toCamelCase, getBlockThumbnailUrl } from "../../util/registry";

const props = defineProps<{
   block: Block;
}>();

const thumbnailError = ref<boolean>(false);
const thumbnailUrl = computed(() => {
   return getBlockThumbnailUrl(props.block.directory);
});

function handleDragStart(event: DragEvent, block: Block) {
   if (!event.dataTransfer) return;
   // Store the block type in dataTransfer
   event.dataTransfer.setData("block-type", toCamelCase(block.__name));
   event.dataTransfer.effectAllowed = "move";
}
</script>
