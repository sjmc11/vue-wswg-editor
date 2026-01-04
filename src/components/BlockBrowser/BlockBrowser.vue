<template>
   <div class="block-browser">
      <div class="block-browser__header">
         <input v-model="blockSearch" type="text" placeholder="Search blocks" class="block-browser__search" />
      </div>
      <div v-if="!blockCount" class="block-browser__empty">
         <p>Create your first block to get started.</p>
         <p class="block-browser__empty-link">
            <a href="https://github.com/sano-io/page-builder/tree/main/blocks" target="_blank">How to create a block</a>
         </p>
      </div>
      <div v-else-if="!filteredBlocks.length" class="block-browser__empty">No blocks found</div>
      <div v-else id="available-blocks-list" class="block-browser__grid">
         <AddBlockItem v-for="block in filteredBlocks" :key="block.type" :block="block" />
      </div>
   </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { themeBlocks } from "../../util/theme-registry";
import AddBlockItem from "../AddBlockItem/AddBlockItem.vue";
import type { Block } from "../../types/Block";
import Sortable from "sortablejs";

const blockSearch = ref("");
const filteredBlocks = computed(() => {
   if (!themeBlocks.value) return [];
   return Object.values(themeBlocks.value).filter((block: Block) => {
      // against block name and label
      return (
         block.type?.toLowerCase().includes(blockSearch.value.toLowerCase()) ||
         block.label?.toLowerCase().includes(blockSearch.value.toLowerCase())
      );
   });
});

const blockCount = computed(() => {
   if (!themeBlocks.value) return 0;
   return Object.values(themeBlocks.value).length;
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

<style scoped lang="scss">
.block-browser {
   container-type: inline-size;

   &__header {
      padding: 0.75rem 1.25rem;
      border-bottom: 1px solid #d1d5db;
      background-color: #fff;
   }

   &__search {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
   }

   &__empty {
      padding: 1.25rem;
      font-size: 0.875rem;
      color: #71717a;
      text-align: center;
   }

   &__empty-link {
      margin-top: 0.75rem;

      a {
         color: #2563eb;
         text-decoration: underline;
         text-underline-offset: 2px;

         &:hover {
            color: #1e40af;
         }
      }
   }

   &__grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.75rem;
      padding: 1.25rem;
   }
}

@container (min-width: 360px) {
   .block-browser__grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
   }
}

@container (min-width: 560px) {
   .block-browser__grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
   }
}
</style>
