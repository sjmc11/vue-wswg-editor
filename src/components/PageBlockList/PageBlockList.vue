<template>
   <div id="page-blocks-list" class="flex flex-col gap-1 p-5">
      <template v-if="pageBlocks?.length">
         <div
            v-for="block in pageBlocks"
            :key="block.id"
            :class="{ 'hovered-block': hoveredBlockId === block.id }"
            class="block-item -mx-2.5 flex cursor-pointer items-center gap-1 rounded-md p-2.5 text-sm text-neutral-900"
            @mouseenter="setHoveredBlockId(block.id)"
            @mouseleave="setHoveredBlockId(null)"
            @click="emit('block-click', block)"
         >
            <p>{{ block.label || block.type }}</p>
            <span v-if="!block.__file" class="ml-auto rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500"
               >Not registered</span
            >
         </div>
      </template>
      <template v-else>
         <p class="bg-zinc-100 p-5 text-center text-sm text-zinc-500">No blocks added yet.</p>
      </template>
   </div>
</template>

<script setup lang="ts">
import { computed, defineEmits, onMounted, ref } from "vue";
import { Block, pageBuilderBlocks } from "../../util/registry";
import { toCamelCase, toNiceName } from "../../util/helpers";
import Sortable from "sortablejs";

const emit = defineEmits<{
   (e: "block-click", block: Block): void;
}>();

const pageData = defineModel<any>();
const hoveredBlockId = defineModel<string | null>("hoveredBlockId");
const isSorting = ref(false);
const props = defineProps<{
   blocksKey: string;
   settingsKey: string;
}>();

const pageBlocks = computed(() => {
   if (!pageData.value?.[props.blocksKey]) return [];
   // loop through pageData[blocksKey] and get the block data from registry or return a default block data
   return pageData.value[props.blocksKey].map((block: any) => {
      if (pageBuilderBlocks.value[toCamelCase(block.type)]) {
         return {
            ...pageBuilderBlocks.value[toCamelCase(block.type)],
            ...block,
         };
      }
      // Fallback to default block data
      return {
         id: block.id,
         name: block.type,
         label: toNiceName(block.type),
         icon: "question-mark",
         thumbnail: "https://via.placeholder.com/150",
      };
   });
});

function setHoveredBlockId(id: string | null) {
   if (isSorting.value) return;
   hoveredBlockId.value = id;
}

function initSortable() {
   const sortableListWrapper = document.getElementById("page-blocks-list");
   if (!sortableListWrapper) return;
   new Sortable(sortableListWrapper, {
      animation: 150,
      ghostClass: "sortable-ghost",
      chosenClass: "sortable-chosen",
      dragClass: "sortable-drag",
      onStart: () => {
         isSorting.value = true;
      },
      onEnd: (event: any) => {
         isSorting.value = false;
         const { oldIndex, newIndex } = event;
         if (oldIndex !== newIndex) {
            const movedBlock = pageData.value?.[props.blocksKey]?.splice(oldIndex, 1)[0];
            pageData.value?.[props.blocksKey]?.splice(newIndex, 0, movedBlock);
         }
      },
   });
}

onMounted(() => {
   initSortable();
});
</script>

<style scoped lang="scss">
.block-item {
   &.hovered-block {
      @apply bg-blue-100 text-blue-600;
   }
}
</style>
