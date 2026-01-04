<template>
   <div class="margin-field" :class="{ 'margin-field--unlinked': !linkedMargin }">
      <div v-if="linkedMargin" class="field-wrapper margin-field__wrapper" title="Top & Bottom Margin">
         <span class="margin-field__icon">
            <ArrowsUpDownIcon class="margin-field__icon-svg" />
         </span>
         <select
            v-model="linkedMarginValue"
            class="form-control margin-field__select"
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
         <div class="margin-field__group">
            <div class="field-wrapper margin-field__wrapper" title="Top Margin">
               <span class="margin-field__icon">
                  <ArrowUpIcon class="margin-field__icon-svg" />
               </span>
               <select
                  v-model="fieldValue.top"
                  class="form-control margin-field__select"
                  :placeholder="fieldConfig.placeholder"
                  :disabled="!editable"
               >
                  <option v-for="option in fieldConfig.options" :key="option.value" :value="option.value">
                     {{ option.label }}
                  </option>
               </select>
            </div>
            <div class="field-wrapper margin-field__wrapper" title="Bottom Margin">
               <span class="margin-field__icon">
                  <ArrowDownIcon class="margin-field__icon-svg" />
               </span>
               <select
                  v-model="fieldValue.bottom"
                  class="form-control margin-field__select"
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
         class="margin-field__link-btn"
         :class="linkedMargin ? 'margin-field__link-btn--active' : 'margin-field__link-btn--inactive'"
         @click="toggleLinkedMargin"
      >
         <LinkIcon v-if="linkedMargin" class="margin-field__link-icon" />
         <LinkSlashIcon v-else class="margin-field__link-icon" />
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
.margin-field {
   display: flex;
   gap: 0.5rem;

   &--unlinked {
      align-items: flex-start;
   }

   &__group {
      display: flex;
      flex: 1 1 0%;
      gap: 0.5rem;
   }

   &__wrapper {
      position: relative;
      flex: 1 1 0%;
   }

   &__icon {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 1;
      display: inline-flex;
      width: 2.4rem;
      height: 100%;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      pointer-events: none;
      border-right: 1px solid #d1d5db;
   }

   &__icon-svg {
      width: 0.75rem;
      height: 0.75rem;
   }

   &__select {
      padding-left: 3rem !important;
   }

   &__link-btn {
      display: inline-flex;
      flex-shrink: 0;
      width: 2.5rem;
      height: 2.5rem;
      align-items: center;
      justify-content: center;
      padding: 0.5rem;
      text-align: center;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      transition: all 0.15s ease-in-out;

      &--active {
         background-color: #eff6ff;
         border-color: #bfdbfe;

         &:hover {
            background-color: #dbeafe;
         }
      }

      &--inactive {
         background-color: #fafafa;
         border-color: #e4e4e7;

         &:hover {
            background-color: #f4f4f5;
            border-color: #d4d4d8;
         }
      }
   }

   &__link-icon {
      width: 1rem;
      height: 1rem;
   }
}

select.form-control {
   padding-right: 32px;
   appearance: none;
   background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E"); // down chevron
   background-repeat: no-repeat;
   background-position: right 8px center;
   background-size: 20px;
}
</style>
