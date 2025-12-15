<template>
   <div id="page-viewport" class="page-renderer-wrapper relative">
      <template v-if="isReady">
         <component :is="layoutComponent" v-if="withLayout && layoutComponent" v-bind="settings" :blocks="blocks">
            <template #default>
               <div id="page-blocks-wrapper">
                  <div
                     v-for="block in blocks"
                     :key="block.id"
                     class="block-wrapper"
                     :class="{ [getMarginClass(block)]: true }"
                  >
                     <component :is="getBlock(block.type)" v-bind="block" :key="`block-${block.id}`" />
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
               <component :is="getBlock(block.type)" v-bind="block" :key="`block-${block.id}`" />
            </div>
         </div>
      </template>
   </div>
</template>

<script setup lang="ts">
import { computed, withDefaults, onBeforeMount, ref } from "vue";
import type { Block } from "../../types/Block";
import { initialiseRegistry, getBlock, getLayout } from "../../util/theme-registry";

const props = withDefaults(
   defineProps<{
      blocks: Block[];
      layout?: string;
      settings?: Record<string, any>;
      withLayout?: boolean;
      theme?: string;
   }>(),
   {
      layout: "default",
      settings: () => ({}),
      withLayout: false,
      theme: "default",
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
   const top = block.margin?.top || "none";
   const bottom = block.margin?.bottom || "none";

   // Map margin sizes to custom class names: none, sm, md, lg, xl
   const getClass = (size: string, direction: "top" | "bottom"): string => {
      const normalizedSize = size === "small" ? "sm" : size === "medium" ? "md" : size === "large" ? "lg" : size;
      return `margin-${direction}-${normalizedSize}`;
   };

   return [getClass(top, "top"), getClass(bottom, "bottom")].join(" ");
}

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
   .block-wrapper {
      @include block-margin-classes;
   }
}
</style>
