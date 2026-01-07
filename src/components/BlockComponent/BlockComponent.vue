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
         v-if="blockComponent"
         class="block-component"
         @mouseenter="emit('hoverBlock', block.id)"
         @mouseleave="emit('hoverBlock', null)"
         @click="emit('clickBlock', block)"
      >
         <div v-if="activeBlock?.id === block.id" class="editing-badge">
            <span>Editing</span>
         </div>
         <component :is="blockComponent" v-bind="block" ref="blockComponentRef" />
      </div>
      <div
         v-else-if="isRegistryReady"
         class="block-not-found"
         @mouseenter="emit('hoverBlock', block.id)"
         @mouseleave="emit('hoverBlock', null)"
      >
         <div class="block-not-found__content">
            <p class="block-not-found__text">Block not registered</p>
            <span class="block-not-found__badge">
               {{ toCamelCase(block.type) }}
            </span>
         </div>
      </div>
   </div>
</template>

<script setup lang="ts">
import { computed, useTemplateRef } from "vue";
import { getBlock, isRegistryReady } from "../../util/theme-registry";
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

const blockComponent = computed<Block | undefined>(() => {
   return getBlock(props.block.type) || undefined;
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
      background-color: var(--margin-color, #faf6d5e0);
      border: 2px dashed var(--margin-border-color, #cbc59c);
      border-radius: 7px;
      opacity: 0;
      transform: scaleY(0.9) scaleX(0.98);
      transition: all 0.3s ease;
   }

   .block-component {
      position: relative;
      cursor: pointer;
   }

   .editing-badge {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      z-index: 40;
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      color: #fff;
      background-color: var(--block-badge-color, #638ef1);
      border-radius: 9999px;
   }

   .block-not-found {
      padding: 0.5rem 0.75rem;

      &__content {
         padding: 0.75rem 1.25rem;
         font-size: 0.875rem;
         color: #52525b;
         text-align: center;
         background-color: #e4e4e7;
         border-radius: 0.5rem;
      }

      &__text {
         margin-bottom: 0.5rem;
      }

      &__badge {
         display: inline-block;
         padding: 0.25rem 0.5rem;
         color: #52525b;
         background-color: #d4d4d8;
         border-radius: 9999px;
      }
   }

   // Active state - apply overlay and show margin spacing
   &.active-block {
      .block-component {
         @include overlay-apply;
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
         @include overlay-apply;
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
