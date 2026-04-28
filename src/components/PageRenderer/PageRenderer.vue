<template>
   <div id="page-viewport" class="page-renderer-wrapper">
      <template v-if="isReady">
         <component
            :is="layoutComponent"
            v-if="withLayout && layoutComponent"
            ref="layoutComponentRef"
            v-bind="{ ...attrs, ...settings }"
            :blocks="blocks"
            :isEditorMode="false"
         >
            <template #default="layoutSlotProps">
               <div id="page-blocks-wrapper">
                  <div v-for="block in blocks" :key="block.id" class="block-wrapper">
                     <template v-if="!isOmittedBlock(block.id, layoutSlotProps?.omitBlocks)">
                        <component
                           :is="getBlock(block.type)"
                           v-bind="{ ...attrs, ...layoutSlotProps, ...block }"
                           :key="`block-${block.id}`"
                           :class="{ [getMarginClass(block)]: true }"
                        />
                     </template>
                  </div>
               </div>
            </template>
         </component>
         <div v-else id="page-blocks-wrapper">
            <div
               v-for="block in blocks"
               :key="block.id"
               class="block-wrapper"
               :class="{ [getMarginClass(block)]: true }"
            >
               <template v-if="!isOmittedBlock(block.id)">
                  <component :is="getBlock(block.type)" v-bind="{ ...attrs, ...block }" :key="`block-${block.id}`" />
               </template>
            </div>
         </div>
      </template>
   </div>
</template>

<script setup lang="ts">
import { computed, onBeforeMount, ref, useAttrs } from "vue";
import type { Block } from "../../types/Block";
import { initialiseRegistry, getBlock, getLayout } from "../../util/theme-registry";

defineOptions({ inheritAttrs: false });

const attrs = useAttrs();

const props = withDefaults(
   defineProps<{
      blocks: Block[];
      layout?: string;
      settings?: Record<string, any>;
      withLayout?: boolean;
      theme?: string;
      omitBlocks?: string[];
   }>(),
   {
      layout: "default",
      settings: () => ({}),
      withLayout: false,
      theme: "default",
      omitBlocks: () => [],
   }
);

const isReady = ref(false);

// Get the layout component based on the layout prop
const layoutComponent = computed(() => {
   return getLayout(props.layout || props.settings?.layout);
});

// Get the margin class for the block
// Margin is an object with top and bottom properties
// margin classses are formatted as `margin-<direction>-<size>`
function getMarginClass(block: Block): string {
   const top = block.margin?.top;
   const bottom = block.margin?.bottom;

   const classes: string[] = [];
   if (top) classes.push(`margin-top-${top}`);
   if (bottom) classes.push(`margin-bottom-${bottom}`);

   return classes.join(" ");
}

const isOmittedBlock = (blockId: string, omitBlocks?: string[]): boolean => {
   const blocksToOmit = omitBlocks || props.omitBlocks;
   if (!blocksToOmit?.length) return false;
   return blocksToOmit.includes(blockId);
};

onBeforeMount(async () => {
   isReady.value = false;

   // Initialise registries for editor preview
   // Exclude the editing registry to load only the theme and blocks
   await initialiseRegistry(props.theme, false);

   isReady.value = true;
});
</script>

<style lang="scss">
@use "../../assets/styles/mixins" as *;

// Styles are scoped to the component using the root class selector instead of Vue's scoped attribute
// This ensures styles work correctly when the component is consumed from a library
.page-renderer-wrapper {
   position: relative;

   .block-wrapper {
      > * {
         @include block-margin-classes;
      }
   }
}
</style>
