<template>
   <!-- Control bar -->
   <div class="flex divide-x border-b">
      <slot name="default">
         <!-- no default toolbar content -->
      </slot>

      <!-- Desktop / Mobile view toggle -->
      <div v-if="hasPageSettings" class="ml-auto inline-flex gap-2 px-5 py-2.5">
         <button
            class="inline-flex items-center rounded-md border px-3 py-2 text-xs"
            :class="
               showPageSettings
                  ? 'bg-blue-50 text-blue-700 border-blue-800/20'
                  : 'bg-zinc-50 text-zinc-500 hover:border-zinc-400 hover:text-zinc-900'
            "
            title="Page settings"
            @click="
               showPageSettings = !showPageSettings;
               activeBlock = null;
            "
         >
            <Cog6ToothIcon class="size-4" />
         </button>
      </div>
      <div class="inline-flex gap-2 px-5 py-2.5">
         <button
            class="inline-flex items-center rounded-md border px-3 py-2 text-xs"
            :class="
               editorViewport === 'mobile'
                  ? 'bg-blue-50 text-blue-700 border-blue-800/20'
                  : 'bg-zinc-50 text-zinc-500 hover:border-zinc-400 hover:text-zinc-900'
            "
            title="Mobile view"
            @click="editorViewport = 'mobile'"
         >
            <DevicePhoneMobileIcon class="size-4" />
         </button>
         <button
            class="inline-flex items-center rounded-md border px-3 py-2 text-xs"
            :class="
               editorViewport === 'desktop'
                  ? 'bg-blue-50 text-blue-700 border-blue-800/20'
                  : 'bg-zinc-50 text-zinc-500 hover:border-zinc-400 hover:text-zinc-900'
            "
            title="Desktop view"
            @click="editorViewport = 'desktop'"
         >
            <ComputerDesktopIcon class="size-4" />
         </button>
      </div>
   </div>
</template>
<script setup lang="ts">
const editorViewport = defineModel<"desktop" | "mobile">("editorViewport");
const activeBlock = defineModel<any>("activeBlock");
const showPageSettings = defineModel<boolean>("showPageSettings");
import { ComputerDesktopIcon, DevicePhoneMobileIcon, Cog6ToothIcon } from "@heroicons/vue/24/outline";

defineProps<{
   hasPageSettings: boolean;
}>();
</script>
