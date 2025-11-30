<template>
   <div class="margin-field flex gap-2" :class="linkedMargin ? '' : 'items-start'">
      <div v-if="linkedMargin" class="field-wrapper relative flex-1" title="Top & Bottom Margin">
         <span class="pointer-events-none absolute left-0 top-0 inline-flex h-full items-center border-r px-3 text-xs">
            <ArrowsUpDownIcon class="size-3" />
         </span>
         <select
            v-model="linkedMarginValue"
            class="form-control"
            style="padding-left: 3rem"
            :placeholder="fieldConfig.placeholder"
            :disabled="!editable"
            @change="handleLinkedMarginChange"
         >
            <option v-for="option in fieldConfig.options" :key="option.value" :value="option.value">
               {{ option.label }}
            </option>
         </select>
      </div>
      <template v-else-if="fieldValue">
         <div class="flex flex-1 gap-2">
            <div class="field-wrapper relative flex-1" title="Top Margin">
               <span
                  class="pointer-events-none absolute left-0 top-0 inline-flex h-full items-center justify-center border-r px-3 text-xs"
                  ><ArrowUpIcon class="size-3"
               /></span>
               <select
                  v-model="fieldValue.top"
                  class="form-control"
                  style="padding-left: 3rem"
                  :placeholder="fieldConfig.placeholder"
                  :disabled="!editable"
               >
                  <option v-for="option in fieldConfig.options" :key="option.value" :value="option.value">
                     {{ option.label }}
                  </option>
               </select>
            </div>
            <div class="field-wrapper relative flex-1" title="Bottom Margin">
               <span
                  class="pointer-events-none absolute left-0 top-0 inline-flex h-full items-center justify-center border-r px-3 text-xs"
               >
                  <ArrowDownIcon class="size-3" />
               </span>
               <select
                  v-model="fieldValue.bottom"
                  class="form-control"
                  style="padding-left: 3rem"
                  :placeholder="fieldConfig.placeholder"
                  :disabled="!editable"
               >
                  <option v-for="option in fieldConfig.options" :key="option.value" :value="option.value">
                     {{ option.label }}
                  </option>
               </select>
            </div>
         </div>
      </template>
      <button
         v-if="editable"
         title="Link Margin (Top & Bottom)"
         class="inline-flex size-10 shrink-0 items-center justify-center rounded-md border p-2 text-center"
         :class="
            linkedMargin
               ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
               : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-100'
         "
         @click="toggleLinkedMargin"
      >
         <LinkIcon v-if="linkedMargin" class="size-4" />
         <LinkSlashIcon v-else class="size-4" />
      </button>
   </div>
</template>

<script setup lang="ts">
import { defineProps, ref, onMounted } from "vue";
import type { EditorFieldConfig } from "../../util/fieldConfig";
import { LinkIcon, LinkSlashIcon, ArrowUpIcon, ArrowDownIcon, ArrowsUpDownIcon } from "@heroicons/vue/24/outline";

const props = defineProps<{
   fieldConfig: EditorFieldConfig;
   editable: boolean;
}>();

const linkedMargin = ref(false);
const linkedMarginValue = ref<string>(props.fieldConfig.default);

const fieldValue = defineModel<{ top: string; bottom: string } | undefined>();

const toggleLinkedMargin = () => {
   linkedMargin.value = !linkedMargin.value;
   if (linkedMargin.value) {
      linkedMarginValue.value = fieldValue.value?.top || fieldValue.value?.bottom || props.fieldConfig.default || "";
      fieldValue.value = { top: linkedMarginValue.value || "", bottom: linkedMarginValue.value || "" };
   } else {
      fieldValue.value = {
         top: linkedMarginValue.value || props.fieldConfig.default || "",
         bottom: linkedMarginValue.value || props.fieldConfig.default || "",
      };
   }
};

const handleLinkedMarginChange = () => {
   if (!linkedMarginValue.value) return;
   fieldValue.value = { top: linkedMarginValue.value, bottom: linkedMarginValue.value };
};

onMounted(() => {
   // If top and bottom margin are the same, set linked margin to true
   if (fieldValue.value?.top === fieldValue.value?.bottom) {
      linkedMargin.value = true;
      linkedMarginValue.value = fieldValue.value?.top || props.fieldConfig.default || "";
   }

   // If top and bottom margin are not set, set them to the default value
   if (!fieldValue.value || !fieldValue.value.top || !fieldValue.value.bottom) {
      fieldValue.value = { top: props.fieldConfig.default || "", bottom: props.fieldConfig.default || "" };
   }
});
</script>

<style scoped lang="scss">
select.form-control {
   padding-right: 32px;
   appearance: none;
   background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E"); // down chevron
   background-repeat: no-repeat;
   background-position: right 8px center;
   background-size: 20px;
}
</style>
