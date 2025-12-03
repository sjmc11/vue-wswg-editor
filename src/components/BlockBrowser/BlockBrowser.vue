<template>
   <div class="block-browser">
      <div class="block-browser-header border-b border-gray-300 bg-white px-5 py-3">
         <input
            v-model="blockSearch"
            type="text"
            placeholder="Search blocks"
            class="w-full rounded-md border border-gray-300 p-2"
         />
      </div>
      <div v-if="!blockCount" class="p-5 text-center text-sm text-zinc-500">
         <p>Create your first block to get started.</p>
         <p class="mt-3">
            <a
               href="https://github.com/sano-io/page-builder/tree/main/blocks"
               target="_blank"
               class="text-blue-600 underline underline-offset-2 hover:text-blue-800"
               >How to create a block</a
            >
         </p>
      </div>
      <div v-else-if="!filteredBlocks.length" class="p-5 text-center text-sm text-zinc-500">No blocks found</div>
      <div v-else id="available-blocks-list" class="available-blocks-grid">
         <AddBlockItem v-for="block in filteredBlocks" :key="block.type" :block="block" />
      </div>
   </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { pageBuilderBlocks } from "../../util/registry";
import AddBlockItem from "../AddBlockItem/AddBlockItem.vue";
import type { Block } from "../../types/Block";
import Sortable from "sortablejs";

const blockSearch = ref("");
const filteredBlocks = computed(() => {
   if (!pageBuilderBlocks.value) return [];
   return Object.values(pageBuilderBlocks.value).filter((block: Block) => {
      // against block name and label
      return (
         block.type?.toLowerCase().includes(blockSearch.value.toLowerCase()) ||
         block.label?.toLowerCase().includes(blockSearch.value.toLowerCase())
      );
   });
});

const blockCount = computed(() => {
   if (!pageBuilderBlocks.value) return 0;
   return Object.values(pageBuilderBlocks.value).length;
});

function initSortable() {
   const sortableBlocksWrapper = document.getElementById("available-blocks-list");
   if (!sortableBlocksWrapper) return;
   if (!blockCount.value) return;
   new Sortable(sortableBlocksWrapper, {
      animation: 150,
      ghostClass: "sortable-ghost",
      chosenClass: "sortable-chosen",
      dragClass: "sortable-drag",
      group: {
         name: "page-blocks",
         pull: "clone",
         put: false,
      },
      sort: false,
   });
}

onMounted(() => {
   initSortable();
});
</script>

<style scoped>
.block-browser {
   container-type: inline-size;
}

.available-blocks-grid {
   display: grid;
   grid-template-columns: 1fr;
   gap: 0.75rem;
   padding: 1.25rem;
}

@container (min-width: 360px) {
   .available-blocks-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
   }
}

@container (min-width: 560px) {
   .available-blocks-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
   }
}
</style>
