<template>
   <div
      :data-block-type="block.type"
      draggable="true"
      class="cursor-pointer rounded-md border bg-zinc-50 p-3 text-sm text-zinc-900 hover:border-zinc-400 hover:text-zinc-900"
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
      <!-- icon -->
      <div v-else-if="block.icon" class="mb-2 flex h-28 w-full items-center justify-center rounded-md bg-zinc-200">
         <span>Icon: {{ block.icon }}</span>
      </div>
      <!-- placeholder -->
      <div v-else class="mb-2 flex h-28 w-full items-center justify-center rounded-md bg-zinc-200">
         <CubeTransparentIcon class="size-6 text-zinc-400" />
      </div>
      <p class="font-bold">{{ block.label }}</p>
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
   // Store the block type in dataTransfer
   event.dataTransfer.setData("block-type", block.__name);
   event.dataTransfer.effectAllowed = "move";
}
</script>
