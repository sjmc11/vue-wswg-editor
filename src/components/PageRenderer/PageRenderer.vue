<template>
   <div id="page-blocks-wrapper">
      <div v-for="block in blocks" :key="block.id" class="block-wrapper" :class="{ [getMarginClass(block)]: true }">
         <component :is="getBlock(block.type)" v-bind="block" :key="`block-${block.id}`" />
      </div>
   </div>
</template>

<script setup lang="ts">
import { type Component } from "vue";
import { generateNameVariations } from "../../util/helpers";
import { blockModules } from "./blockModules";
import type { Block } from "../../types/Block";

defineProps<{
   blocks: Block[];
}>();

function getBlock(blockType: string): Component | undefined {
   // Generate name variations and try to find a match in blockModules keys (file paths)
   const nameVariations = generateNameVariations(blockType);

   // Iterate through all blockModules entries
   for (const [filePath, module] of Object.entries(blockModules)) {
      // Check if any variation matches the file path
      for (const variation of nameVariations) {
         // Check if the file path contains the variation followed by .vue
         // e.g., "hero-section" matches "blocks/hero-section/hero-section.vue"
         if (filePath.includes(`${variation}.vue`)) {
            // Extract the default export (the Vue component)
            const component = (module as any).default;
            if (component) {
               return component;
            }
         }
      }
   }

   return undefined;
}

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
</script>

<style scoped lang="scss">
@use "../../assets/styles/mixins" as *;

.block-wrapper {
   @include block-margin-classes;
}
</style>
