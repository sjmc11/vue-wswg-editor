<template>
   <!-- Control bar -->
   <div class="toolbar">
      <slot name="default">
         <!-- no default toolbar content -->
      </slot>

      <!-- Page settings toggle -->
      <div v-if="hasPageSettings" class="toolbar__group toolbar__group--end">
         <button
            class="wswg-btn"
            :class="showPageSettings ? 'wswg-btn--active' : 'wswg-btn--secondary'"
            title="Page settings"
            @click="
               showPageSettings = !showPageSettings;
               activeBlock = null;
            "
         >
            <Cog6ToothIcon class="wswg-icon--sm" />
         </button>
      </div>

      <!-- Desktop / Mobile view toggle -->
      <div class="toolbar__group">
         <button
            class="wswg-btn"
            :class="editorViewport === 'mobile' ? 'wswg-btn--active' : 'wswg-btn--secondary'"
            title="Mobile view"
            @click="editorViewport = 'mobile'"
         >
            <DevicePhoneMobileIcon class="wswg-icon--sm" />
         </button>
         <button
            class="wswg-btn"
            :class="editorViewport === 'desktop' ? 'wswg-btn--active' : 'wswg-btn--secondary'"
            title="Desktop view"
            @click="editorViewport = 'desktop'"
         >
            <ComputerDesktopIcon class="wswg-icon--sm" />
         </button>
      </div>
   </div>
</template>

<script setup lang="ts">
import { ComputerDesktopIcon, DevicePhoneMobileIcon, Cog6ToothIcon } from "@heroicons/vue/24/outline";

const editorViewport = defineModel<"desktop" | "mobile">("editorViewport");
const activeBlock = defineModel<any>("activeBlock");
const showPageSettings = defineModel<boolean>("showPageSettings");

defineProps<{
   hasPageSettings: boolean;
}>();
</script>

<style scoped lang="scss">
.toolbar {
   display: flex;
   border-bottom: 1px solid #d1d5db;

   &__group {
      display: inline-flex;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;

      &:not(:last-child) {
         border-right: 1px solid #d1d5db;
      }

      &--end {
         margin-left: auto;
      }
   }
}
</style>
