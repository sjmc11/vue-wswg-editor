<template>
   <div
      class="block-wrapper"
      :class="{
         [getMarginClass(block)]: true,
         'active-block': activeBlock?.id === block.id,
         'hovered-block': hoveredBlockId === block.id,
      }"
      :data-block-index="blockIndex"
      :data-block-id="block.id"
   >
      <div
         v-if="activeBlock?.id === block.id"
         class="absolute -top-3 right-4 z-10 rounded-full bg-blue-500 px-2 py-1 text-xs text-white"
      >
         <p>Editing</p>
      </div>
      <div
         v-if="pageBuilderBlocks[toCamelCase(block.type)]"
         class="block-component"
         @mouseenter="emit('hoverBlock', block.id)"
         @mouseleave="emit('hoverBlock', null)"
         @click="emit('clickBlock', block)"
      >
         <component :is="pageBuilderBlocks[toCamelCase(block.type)]" v-bind="block" ref="blockComponentRef" />
      </div>
      <div
         v-else
         class="block-not-found px-3 py-2"
         @mouseenter="emit('hoverBlock', block.id)"
         @mouseleave="emit('hoverBlock', null)"
      >
         <div class="rounded-lg bg-zinc-200 p-5 px-3 text-center text-sm text-zinc-600">
            <p class="mb-2">Block not registered</p>
            <span class="rounded-full bg-zinc-300 px-2 py-1 text-zinc-600">
               {{ toCamelCase(block.type) }}
            </span>
         </div>
      </div>
   </div>
</template>

<script setup lang="ts">
import { useTemplateRef } from "vue";
import { onClickOutside } from "@vueuse/core";
import { pageBuilderBlocks, Block } from "../../util/registry";
import { toCamelCase } from "../../util/helpers";
import { onKeyStroke } from "@vueuse/core";

const emit = defineEmits<{
   (e: "hoverBlock", id: string | null): void;
   (e: "clickBlock", block: Block | null): void;
}>();

const props = defineProps<{
   block: Block;
   blockIndex: number;
   activeBlock: Block | null;
   hoveredBlockId: string | null;
}>();

const blockComponentRef = useTemplateRef<HTMLElement | null>("blockComponentRef");

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

// Click outside detection
onClickOutside(
   blockComponentRef,
   () => {
      // Unset active block
      emit("clickBlock", null);
   },
   { ignore: ["#page-builder-sidebar", "#page-builder-resize-handle", "button"] }
);

// On escape key press
onKeyStroke("Escape", () => {
   if (!props.activeBlock) return;
   // Unset active block
   emit("clickBlock", null);
});
</script>

<style scoped lang="scss">
@use "../../assets/styles/mixins" as *;
.block-wrapper {
   position: relative;
   transition: all 0.3s ease;

   // Margin spacing overlay
   &::before,
   &::after {
      position: absolute;
      left: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 0;
      font-size: 14px;
      font-weight: 500;
      color: #888017;
      content: "Spacing";
      background-color: #f7efac;
      border: 2px dashed #d2c564;
      border-radius: 7px;
      opacity: 0;
      transform: scaleY(0.9) scaleX(0.98);
      transition: all 0.3s ease;
   }

   .block-component {
      cursor: pointer;
      position: relative;
      // Highlight block overlay
      &::before {
         position: absolute;
         left: 0;
         top: 0;
         width: 100%;
         height: 100%;
         content: "";
         background-color: #9fd0f643;
         outline: 2px dashed #638ef1;
         outline-offset: -2px;
         pointer-events: none;
         opacity: 0;
         z-index: 2;
      }
   }

   // Active state
   &.active-block {
      .block-component {
         &::before {
            background-color: #9fd0f643;
            border-color: #638ef1;
            opacity: 1;
         }
      }
      // Show the margin spacing overlay
      &::after,
      &::before {
         opacity: 1;
      }
   }

   // Hovered state
   &.hovered-block {
      .block-component {
         &::before {
            background-color: #9fd0f643;
            border-color: #638ef1;
            opacity: 1;
         }
      }
      // Show the margin spacing overlay
      &::after,
      &::before {
         opacity: 1;
      }
   }

   // Block margin classes - generated using mixin
   @include block-margin-classes;
}
</style>
