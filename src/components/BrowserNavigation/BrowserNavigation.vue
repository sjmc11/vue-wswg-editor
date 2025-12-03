<template>
   <!-- URL bar -->
   <div class="browser-navigation-bar">
      <div class="flex items-center justify-between rounded-t-lg bg-zinc-600 px-5 py-4">
         <div class="flex w-full items-center gap-2 rounded-md bg-zinc-700 px-4 py-1.5 text-sm text-zinc-300">
            <span class="block flex-1 truncate">{{ url }}</span>

            <a
               :href="url"
               target="_blank"
               title="Open in new tab"
               class="inline-block rounded-md p-1.5 text-xs text-zinc-300 hover:bg-zinc-500 hover:text-white"
            >
               <ArrowUpRightIcon class="size-4" />
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
