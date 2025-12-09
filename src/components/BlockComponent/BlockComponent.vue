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
         v-if="pageBuilderBlocks[toCamelCase(block.type)]"
         class="block-component"
         @mouseenter="emit('hoverBlock', block.id)"
         @mouseleave="emit('hoverBlock', null)"
         @click="emit('clickBlock', block)"
      >
         <div
            v-if="activeBlock?.id === block.id"
            class="editing-badge absolute right-2 top-2 z-40 rounded-full px-2 py-1 text-xs text-white"
         >
            <span>Editing</span>
         </div>
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
import { pageBuilderBlocks } from "../../util/registry";
import type { Block } from "../../types/Block";
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
      background-color: var(--margin-color, #9ff6a543);
      border: 2px dashed var(--margin-border-color, rgba(63, 165, 76, 0.5));
      border-radius: 7px;
      opacity: 0;
      transform: scaleY(0.9) scaleX(0.98);
      transition: all 0.3s ease;
   }

   .block-component {
      position: relative;
      cursor: pointer;
      @include hover-overlay;
   }

   .editing-badge {
      background-color: var(--block-badge-color, #3363d4);
   }

   // Active state - apply overlay and show margin spacing
   &.active-block {
      .block-component {
         @include hover-overlay-apply(
            var(--block-active-color, var(--block-hover-color, #9fd0f643)),
            var(--block-border-color, #638ef1)
         );
      }

      // Show the margin spacing overlay
      &::after,
      &::before {
         opacity: 1;
      }
   }

   // Hovered state - apply overlay and show margin spacing
   &.hovered-block {
      .block-component {
         @include hover-overlay-apply;
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
