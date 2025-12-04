<template>
   <!-- Field -->
   <div class="editor-field-node" :class="{ 'border-red-500': validationErrorMessage }">
      <div class="mb-1 flex items-center gap-1.5">
         <!-- Label -->
         <label class="mr-auto text-sm font-medium first-letter:uppercase">
            {{ fieldConfig.label || fieldName }}
            <span v-if="fieldConfig.required" class="prop-required ml-1 text-red-600">*</span>
         </label>
         <!-- Clearable -->
         <div
            v-if="canClearFieldValue"
            class="cursor-pointer rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 hover:bg-zinc-200 hover:text-zinc-600"
            @click="clearFieldValue"
         >
            <span>Clear</span>
         </div>
         <!-- Description -->
         <div
            v-if="fieldConfig.description && fieldConfig.type !== 'info'"
            :title="fieldConfig.description"
            class="cursor-default"
         >
            <InformationCircleIcon class="size-4 text-zinc-500" />
         </div>
      </div>

      <!-- Custom field component-->
      <template v-if="fieldConfig.component">
         <component :is="fieldConfig.component" v-model="fieldValue" :editable="editable" v-bind="fieldConfig" />
      </template>

      <!-- Generic input (text, number, email, url) -->
      <template v-else-if="['text', 'number', 'email', 'url'].includes(fieldConfig.type)">
         <input v-model="textFieldValue" class="form-control mb-1" :disabled="!editable" v-bind="fieldConfig" />
      </template>

      <!-- Text area -->
      <template v-else-if="fieldConfig.type === 'textarea'">
         <textarea v-model="textFieldValue" class="form-control" :disabled="!editable" v-bind="fieldConfig"></textarea>
      </template>

      <!-- Select -->
      <template v-else-if="fieldConfig.type === 'select'">
         <select
            v-model="textFieldValue"
            class="form-control"
            :placeholder="fieldConfig.placeholder"
            :disabled="!editable"
         >
            <option v-for="option in fieldConfig.options" :key="option.value" :value="option.value">
               {{ option.label }}
            </option>
         </select>
      </template>

      <!-- Color picker -->
      <div v-else-if="fieldConfig.type === 'color'" class="flex gap-2">
         <input v-model="fieldValue" type="color" class="form-control size-10 shrink-0" :disabled="!editable" />
         <input v-model="fieldValue" type="text" class="form-control" :disabled="!editable" />
      </div>

      <!-- Range input -->
      <div v-else-if="fieldConfig.type === 'range'" class="flex items-center gap-2">
         <span class="rounded-full bg-zinc-100 px-2 py-1 text-sm font-bold text-zinc-600">{{ fieldValue }}</span>
         <input
            v-model="fieldValue"
            type="range"
            class="form-control"
            :min="fieldConfig.min || 0"
            :max="fieldConfig.max || 100"
            :step="fieldConfig.step || 1"
            :disabled="!editable"
         />
      </div>

      <!-- Checkbox -->
      <div v-else-if="fieldConfig.type === 'checkbox'" class="form-control flex flex-col gap-2">
         <label
            v-for="option in fieldConfig.options"
            :key="`${fieldName}_${option.value}`"
            class="flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 p-2"
         >
            <input
               :id="`${fieldName}_${option.value}`"
               v-model="checkboxValues"
               :value="option.value"
               type="checkbox"
               class="form-control appearance-none"
               :disabled="!editable"
            />
            <span class="text-sm">{{ option.label }}</span>
         </label>
      </div>

      <!-- Radio -->
      <div v-else-if="fieldConfig.type === 'radio'" class="form-control flex flex-col gap-2">
         <div v-for="option in fieldConfig.options" :key="`${fieldName}_${option.value}`">
            <label
               :for="`${fieldName}_${option.value}`"
               class="has-checked:border-blue-600 has-checked:ring-1 has-checked:ring-blue-600 flex cursor-pointer items-center justify-between gap-4 rounded border border-gray-300 bg-white p-3 text-sm font-medium shadow-sm transition-colors hover:bg-gray-50"
            >
               <p class="text-gray-700">{{ option.label }}</p>

               <input
                  :id="`${fieldName}_${option.value}`"
                  v-model="fieldValue"
                  type="radio"
                  :name="fieldName"
                  class="sr-only"
                  :value="option.value"
                  :checked="fieldValue === option.value"
               />
            </label>
         </div>
      </div>

      <!-- Boolean toggle -->
      <template v-else-if="fieldConfig.type === 'boolean'">
         <label
            :for="fieldName"
            class="has-checked:bg-emerald-700 w-13 relative block h-7 cursor-pointer rounded-full bg-gray-300 transition-colors [-webkit-tap-highlight-color:transparent] hover:bg-gray-400/75"
         >
            <input :id="fieldName" v-model="fieldValue" type="checkbox" class="peer sr-only" :disabled="!editable" />

            <span
               class="absolute inset-y-0 start-0 m-1 size-5 rounded-full bg-white transition-[inset-inline-start] peer-checked:start-6"
            ></span>
         </label>
      </template>

      <!-- Repeater Input -->
      <div v-else-if="fieldConfig.type === 'repeater'">
         <BlockRepeaterNode
            v-model="fieldValue"
            :fieldConfig="fieldConfig"
            :fieldName="fieldName"
            :editable="editable"
         />
      </div>

      <!-- Margin -->
      <div v-else-if="fieldConfig.type === 'margin'">
         <BlockMarginNode v-model="fieldValue" :fieldConfig="fieldConfig" :fieldName="fieldName" :editable="editable" />
      </div>

      <!-- Info -->
      <template v-else-if="fieldConfig.type === 'info'">
         <div class="font-base mt-1 rounded-md bg-zinc-100 p-2 text-sm text-zinc-600 md:p-3">
            <InformationCircleIcon class="float-left mr-1 mt-0.5 inline-block size-4" />
            {{ fieldConfig.description }}
         </div>
      </template>

      <!-- Default fallback -->
      <template v-else>
         <input v-model="textFieldValue" type="text" class="form-control" :disabled="!editable" />
      </template>

      <!-- Validation error message -->
      <div v-if="validationErrorMessage" class="rounded-sm bg-red-50 p-2 px-3 text-xs text-red-600">
         {{ validationErrorMessage }}
      </div>
   </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { EditorFieldConfig } from "../../util/fieldConfig";
import BlockRepeaterNode from "../BlockRepeaterFieldNode/BlockRepeaterNode.vue";
import BlockMarginNode from "../BlockMarginFieldNode/BlockMarginNode.vue";
import { InformationCircleIcon } from "@heroicons/vue/24/outline";
import { createGenericValidator, combineValidators } from "../../util/validation";
import * as yup from "yup";

const fieldValue = defineModel<any>();

const props = defineProps<{
   fieldConfig: EditorFieldConfig;
   fieldName: string;
   editable: boolean;
}>();

const validationErrorMessage = ref<string | null>(null);

// Computed property for checkbox values (array of selected values)
const checkboxValues = computed({
   get: () => {
      // Ensure fieldValue is always an array for checkboxes
      if (!Array.isArray(fieldValue.value)) {
         // If it's a single value, convert to array
         if (fieldValue.value !== null && fieldValue.value !== undefined) {
            return [fieldValue.value];
         }
         // If it's null/undefined, return empty array
         return [];
      }
      return fieldValue.value;
   },
   set: (newValues: any[]) => {
      // Update fieldValue with the array of selected values
      fieldValue.value = newValues.length > 0 ? newValues : [];
   },
});

// Computed property to handle object/array conversion for text inputs
const textFieldValue = computed({
   get: () => {
      if (typeof fieldValue.value === "string") {
         return fieldValue.value;
      }
      if (typeof fieldValue.value === "number" || typeof fieldValue.value === "boolean") {
         return String(fieldValue.value);
      }
      if (fieldValue.value === null || fieldValue.value === undefined) {
         return "";
      }
      // For objects/arrays, convert to JSON string for editing
      if (typeof fieldValue.value === "object") {
         return JSON.stringify(fieldValue.value, null, 2);
      }
      return String(fieldValue.value);
   },
   set: (newValue: string) => {
      // Try to parse as JSON if it looks like JSON, otherwise keep as string
      if (
         newValue &&
         ((typeof newValue === "string" && (newValue.trim().startsWith("{") || newValue.trim().startsWith("["))) ||
            (typeof newValue === "object" && Object.keys(newValue).length > 0))
      ) {
         try {
            fieldValue.value = JSON.parse(newValue);
         } catch {
            fieldValue.value = newValue;
         }
      } else {
         fieldValue.value = newValue;
      }
   },
});

const canClearFieldValue = computed(() => {
   if (!props.fieldConfig.clearable) return false;
   if (props.fieldConfig.type === "checkbox" || props.fieldConfig.type === "radio") {
      return checkboxValues.value.length > 0;
   }
   return fieldValue.value !== undefined;
});
/**
 * Validation
 * Rules are defined in the fields.ts file
 * -----------------------------------------
 * Supported validation rules:
 * maxLength // For text fields
 * minLength // For text fields
 * max // For number fields
 * min // For number fields
 * minItems // For repeater fields
 * maxItems // For repeater fields
 * required // For all fields
 */

async function validateField(): Promise<void> {
   // Create generic validator from field config properties (minLength, maxLength, etc.)
   const genericValidator = createGenericValidator(props.fieldConfig);

   // Combine generic validator with custom validator if provided
   const combinedValidator = combineValidators(genericValidator, props.fieldConfig.validator);

   // If no validator exists, clear any error message
   if (!combinedValidator) {
      validationErrorMessage.value = null;
      return;
   }

   try {
      const result = await combinedValidator(fieldValue.value);
      // True = valid, false = invalid, string = error message
      if (result === true) {
         validationErrorMessage.value = null;
      } else {
         // result is either false or a string error message
         // TODO: i18n
         validationErrorMessage.value = result === false ? "Field is invalid" : result;
      }
   } catch (error) {
      const validationErrorsList = error as yup.ValidationError;
      validationErrorMessage.value = validationErrorsList.errors[0] || "Field is invalid";
   }
}

function clearFieldValue(): void {
   fieldValue.value = null;
   validationErrorMessage.value = null;
}

// Watch the field value and validate it
watch(
   fieldValue,
   async () => {
      if (!props.editable) return;
      await validateField();
   },
   {
      immediate: true,
   }
);
</script>

<style scoped lang="scss">
.editor-field-node {
   :deep(.form-control) {
      // Text based inputs
      &:is(input:not([type="checkbox"], [type="radio"]), textarea, select) {
         width: 100%;
         padding: 8px;
         font-size: 14px;
         color: #333;
         outline: none;
         background-color: #fff;
         border: 1px solid #e0e0e0;
         border-radius: 5px;
         box-shadow: none;
         transition: border-color 0.2s;
      }

      // checkbox input
      label {
         input[type="checkbox"],
         input[type="radio"] {
            width: 16px;
            height: 16px;
            padding: 8px;
            font-size: 14px;
            appearance: none;
            cursor: pointer;
            border: 1px solid #e0e0e0;
            border-radius: 5px;

            &:checked {
               @apply bg-blue-700 border-blue-700;
            }
         }

         &:has(input[type="checkbox"]:checked, input[type="radio"]:checked) {
            @apply bg-blue-50;
         }

         &:hover {
            input[type="checkbox"]:not(:checked),
            input[type="radio"]:not(:checked) {
               @apply border-blue-600;
            }
         }

         &:has(input[type="checkbox"]:disabled, input[type="radio"]:disabled) {
            cursor: not-allowed;
            opacity: 0.75;

            input {
               cursor: not-allowed;
            }
         }
      }

      // Select input chevron icon
      &:is(select) {
         padding-right: 32px;
         appearance: none;
         background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E"); // down chevron
         background-repeat: no-repeat;
         background-position: right 8px center;
         background-size: 20px;
      }

      // Color picker input
      &:is(input[type="color"]) {
         width: auto;
         aspect-ratio: 1/1;
         padding: 3px;
         cursor: pointer;
         background-color: #fff;
         border: none;
         border: 1px solid #e0e0e0;
         border-radius: 5px;
      }

      &:hover {
         border-color: #555;
      }

      &:disabled {
         cursor: not-allowed;
         background-color: #fff;
         opacity: 0.75;
      }
   }
}
</style>
