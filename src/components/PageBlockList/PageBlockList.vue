<template>
   <div id="page-blocks-list" class="page-blocks-list">
      <template v-if="isRegistryReady && pageBlocks?.length">
         <div
            v-for="block in pageBlocks"
            :key="block.id"
            data-prevent-drop="true"
            :class="{ 'block-item--hovered': hoveredBlockId === block.id }"
            class="block-item"
            @mouseenter="setHoveredBlockId(block.id)"
            @mouseleave="setHoveredBlockId(null)"
            @click="emit('block-click', block)"
         >
            <p>{{ block.label || block.type }}</p>
            <span v-if="!block.path" class="block-item__badge">Not registered</span>
         </div>
      </template>
      <template v-else>
         <p class="page-blocks-list__empty">No blocks added yet.</p>
      </template>
   </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { getBlock, isRegistryReady } from "../../util/theme-registry";
import type { Block } from "../../types/Block";
import { toNiceName } from "../../util/helpers";
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
      // Find the corresponding block in the registry
      const registryBlock = getBlock(block.type);

      if (registryBlock) {
         return {
            ...registryBlock,
            ...block,
         };
      }
      // Fallback to default block data
      return {
         id: block.id,
         name: block.type,
         label: toNiceName(block.type),
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
.page-blocks-list {
   display: flex;
   flex-direction: column;
   gap: 0.25rem;
   padding: 1.25rem;
}

.block-item {
   display: flex;
   align-items: center;
   gap: 0.25rem;
   margin-left: -0.625rem;
   margin-right: -0.625rem;
   padding: 0.625rem;
   border-radius: 0.375rem;
   cursor: pointer;
   font-size: 0.875rem;
   color: #171717;

   &--hovered {
      background-color: #dbeafe;
      color: #2563eb;
   }

   &__badge {
      margin-left: auto;
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
      background-color: #f4f4f5;
      font-size: 0.75rem;
      color: #71717a;
   }
}

.page-blocks-list__empty {
   padding: 1.25rem;
   border-radius: 0.375rem;
   background-color: #f4f4f5;
   text-align: center;
   font-size: 0.875rem;
   color: #71717a;
}
</style>
