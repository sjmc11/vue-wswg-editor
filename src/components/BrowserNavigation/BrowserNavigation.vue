<template>
   <!-- URL bar -->
   <div class="browser-navigation-bar">
      <div class="browser-navigation-bar__container">
         <div class="browser-navigation-bar__url-box">
            <span class="browser-navigation-bar__url-text">{{ url }}</span>

            <a :href="url" target="_blank" title="Open in new tab" class="browser-navigation-bar__link">
               <ArrowUpRightIcon class="browser-navigation-bar__icon" />
            </a>
         </div>
      </div>
   </div>
</template>

<script setup lang="ts">
import { ArrowUpRightIcon } from "@heroicons/vue/24/outline";

defineProps<{
   url: string;
}>();
</script>

<style scoped lang="scss">
.browser-navigation-bar {
   &__container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      background-color: #52525b;
   }

   &__url-box {
      display: flex;
      width: 100%;
      gap: 0.5rem;
      align-items: center;
      padding: 0.375rem 1rem;
      font-size: 0.875rem;
      color: #d4d4d8;
      background-color: #3f3f46;
      border-radius: 0.375rem;
   }

   &__url-text {
      display: block;
      flex: 1 1 0%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
   }

   &__link {
      display: inline-block;
      padding: 0.375rem;
      font-size: 0.75rem;
      color: #d4d4d8;
      border-radius: 0.375rem;
      transition: all 0.15s ease-in-out;

      &:hover {
         color: #fff;
         background-color: #71717a;
      }
   }

   &__icon {
      width: 1rem;
      height: 1rem;
   }
}
</style>
