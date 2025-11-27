<template>
   <div class="block-browser">
      <div class="block-browser-header border-b bg-white px-5 py-3">
         <input v-model="blockSearch" type="text" placeholder="Search blocks" class="form-control" />
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
      <div v-else id="available-blocks-list" class="grid grid-cols-1 gap-3 p-5">
         <AddBlockItem v-for="block in filteredBlocks" :key="block.type" :block="block" />
      </div>
   </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { pageBuilderBlocks, type Block } from "../../util/registry";
import AddBlockItem from "../AddBlockItem/AddBlockItem.vue";
import Sortable from "sortablejs";

const blockSearch = ref("");
const filteredBlocks = computed(() => {
   if (!pageBuilderBlocks.value) return [];
   return Object.values(pageBuilderBlocks.value).filter((block: Block) => {
      // against block name and label
      return (
         block.type.toLowerCase().includes(blockSearch.value.toLowerCase()) ||
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
