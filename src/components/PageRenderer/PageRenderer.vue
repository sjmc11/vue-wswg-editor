<template>
   <div id="page-viewport" class="page-renderer-wrapper relative">
      <template v-if="isReady">
         <component :is="layoutComponent" v-if="withLayout && layoutComponent" v-bind="settings">
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
            <pre>{{ blocks }}</pre>
         </div>
      </template>
   </div>
</template>

<script setup lang="ts">
import { type Component, computed, withDefaults, onBeforeMount, ref } from "vue";
import { generateNameVariations } from "../../util/helpers";
import { getBlockModule, loadBlockModules } from "./blockModules";
import { loadLayoutModules, getLayoutModule } from "./layoutModules";
import type { Block } from "../../types/Block";

const props = withDefaults(
   defineProps<{
      blocks: Block[];
      layout?: string;
      settings?: Record<string, any>;
      withLayout?: boolean;
   }>(),
   {
      layout: "default",
      settings: () => ({}),
      withLayout: false,
   }
);

const isReady = ref(false);

function getBlock(blockType: string): Component | undefined {
   // Generate name variations and try to find a match
   const nameVariations = generateNameVariations(blockType);

   // Try each variation to find the block component
   for (const variation of nameVariations) {
      const module = getBlockModule(variation);
      if (module) return module;
   }

   return undefined;
}

function getLayout(layoutName: string): Component | undefined {
   // Generate name variations and try to find a match in layoutModules keys (file paths)
   const nameVariations = generateNameVariations(layoutName);

   // Try each variation to find the block component
   for (const variation of nameVariations) {
      const module = getLayoutModule(variation);
      if (module) return module;
   }

   return undefined;
}

// Get the layout component based on the layout prop
const layoutComponent = computed(() => {
   return getLayout(props.layout);
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
   await loadBlockModules();
   await loadLayoutModules();
   isReady.value = true;
});
</script>

<style scoped lang="scss">
@use "../../assets/styles/mixins" as *;

.block-wrapper {
   @include block-margin-classes;
}
</style>
