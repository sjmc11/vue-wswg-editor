<template>
   <!-- Field -->
   <div class="editor-field-node">
      <div class="editor-field-node__header">
         <!-- Label -->
         <label class="editor-field-node__label">
            {{ fieldConfig.label || fieldName }}
            <span v-if="fieldConfig.required" class="editor-field-node__required">*</span>
         </label>
         <!-- Clearable -->
         <div v-if="canClearFieldValue" class="editor-field-node__clear-btn" @click="clearFieldValue">
            <span>Clear</span>
         </div>
         <!-- Description -->
         <div
            v-if="fieldConfig.description && fieldConfig.type !== 'info'"
            :title="fieldConfig.description"
            class="editor-field-node__description"
         >
            <InformationCircleIcon class="editor-field-node__description-icon" />
         </div>
      </div>

      <!-- Custom field component-->
      <template v-if="fieldConfig.component">
         <component :is="fieldConfig.component" v-model="fieldValue" :editable="editable" v-bind="fieldConfig" />
      </template>

      <!-- Generic input (text, number, email, url) -->
      <template v-else-if="['text', 'number', 'email', 'url'].includes(fieldConfig.type)">
         <input v-model="textFieldValue" class="form-control" :disabled="!editable" v-bind="fieldConfig" />
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
      <div v-else-if="fieldConfig.type === 'color'" class="editor-field-node__color-picker">
         <input
            v-model="fieldValue"
            type="color"
            class="form-control editor-field-node__color-input"
            :disabled="!editable"
         />
         <input v-model="fieldValue" type="text" class="form-control" :disabled="!editable" />
      </div>

      <!-- Range input -->
      <div v-else-if="fieldConfig.type === 'range'" class="editor-field-node__range">
         <span class="editor-field-node__range-value">{{ fieldValue }}{{ fieldConfig.valueSuffix || "" }}</span>
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
      <div v-else-if="fieldConfig.type === 'checkbox'" class="editor-field-node__checkbox-group">
         <label
            v-for="option in fieldConfig.options"
            :key="`${fieldName}_${option.value}`"
            class="editor-field-node__checkbox-label"
         >
            <input
               :id="`${fieldName}_${option.value}`"
               v-model="checkboxValues"
               :value="option.value"
               type="checkbox"
               class="editor-field-node__checkbox-input"
               :disabled="!editable"
            />
            <span class="editor-field-node__checkbox-text">{{ option.label }}</span>
         </label>
      </div>

      <!-- Radio -->
      <div v-else-if="fieldConfig.type === 'radio'" class="editor-field-node__radio-group">
         <div v-for="option in fieldConfig.options" :key="`${fieldName}_${option.value}`">
            <label :for="`${fieldName}_${option.value}`" class="editor-field-node__radio-label">
               <p class="editor-field-node__radio-text">{{ option.label }}</p>

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
         <label :for="fieldName" class="editor-field-node__toggle">
            <input
               :id="fieldName"
               v-model="fieldValue"
               type="checkbox"
               class="editor-field-node__toggle-input"
               :disabled="!editable"
            />
            <span class="editor-field-node__toggle-handle"></span>
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

      <!-- Object Input -->
      <div v-else-if="fieldConfig.type === 'object' && fieldConfig.objectFields">
         <div class="editor-field-node__object-fields">
            <BlockEditorFields
               v-model="objectFieldValue"
               :fields="fieldConfig.objectFields"
               :editable="editable"
               :nested="true"
            />
         </div>
      </div>

      <!-- Image -->
      <div v-else-if="fieldConfig.type === 'image'">
         <BlockImageNode v-model="fieldValue" :fieldConfig="fieldConfig" :fieldName="fieldName" :editable="editable" />
      </div>

      <!-- Margin -->
      <div v-else-if="fieldConfig.type === 'margin'">
         <BlockMarginNode v-model="fieldValue" :fieldConfig="fieldConfig" :fieldName="fieldName" :editable="editable" />
      </div>

      <!-- Info -->
      <template v-else-if="fieldConfig.type === 'info'">
         <div class="editor-field-node__info">
            <InformationCircleIcon class="editor-field-node__info-icon" />
            {{ fieldConfig.description }}
         </div>
      </template>

      <!-- Default fallback -->
      <template v-else>
         <input v-model="textFieldValue" type="text" class="form-control" :disabled="!editable" />
      </template>

      <!-- Validation error message -->
      <div v-if="validationError && typeof validationError === 'string'" class="editor-field-node__error">
         {{ validationError }}
      </div>
   </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { EditorFieldConfig } from "../../util/fieldConfig";
import BlockRepeaterNode from "../BlockRepeaterFieldNode/BlockRepeaterNode.vue";
import BlockMarginNode from "../BlockMarginFieldNode/BlockMarginNode.vue";
import BlockImageNode from "../BlockImageFieldNode/BlockImageNode.vue";
import BlockEditorFields from "../BlockEditorFields/BlockEditorFields.vue";
import { InformationCircleIcon } from "@heroicons/vue/24/outline";
import { validateField as validateFieldUtil, type ValidationResult } from "../../util/validation";
import * as yup from "yup";

const fieldValue = defineModel<any>();

const props = defineProps<{
   fieldConfig: EditorFieldConfig;
   fieldName: string;
   editable: boolean;
}>();

const validationError = ref<string | null | ValidationResult>(null);

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

// Computed property for object field values - ensure it's always an object
const objectFieldValue = computed({
   get: () => {
      // Ensure fieldValue is always an object for object fields
      if (typeof fieldValue.value !== "object" || fieldValue.value === null || Array.isArray(fieldValue.value)) {
         return {};
      }
      return fieldValue.value;
   },
   set: (newValue: Record<string, any>) => {
      fieldValue.value = newValue;
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
 * validator // Custom validation function
 */

async function validateField(): Promise<void> {
   try {
      const result = await validateFieldUtil(fieldValue.value, props.fieldConfig);
      // True = valid, false = invalid, string = error message
      if (result === true) {
         validationError.value = null;
      } else {
         // result is either false or a string error message
         // TODO: i18n
         validationError.value = result === false ? "Field is invalid" : result;
      }
   } catch (error) {
      const validationErrorsList = error as yup.ValidationError;
      validationError.value = validationErrorsList.errors[0] || "Field is invalid";
   }
}

function clearFieldValue(): void {
   fieldValue.value = null;
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
   &__header {
      display: flex;
      gap: 0.375rem;
      align-items: center;
      margin-bottom: 0.25rem;
   }

   &__label {
      margin-right: auto;
      font-size: 0.875rem;
      font-weight: 500;

      &::first-letter {
         text-transform: uppercase;
      }
   }

   &__required {
      margin-left: 0.25rem;
      color: #dc2626;
   }

   &__clear-btn {
      padding: 0.125rem 0.5rem;
      font-size: 0.75rem;
      color: #52525b;
      cursor: pointer;
      background-color: #f4f4f5;
      border-radius: 9999px;
      transition: all 0.15s ease-in-out;

      &:hover {
         color: #52525b;
         background-color: #e4e4e7;
      }
   }

   &__description {
      cursor: default;
   }

   &__description-icon {
      width: 1rem;
      height: 1rem;
      color: #71717a;
   }

   &__color-picker {
      display: flex;
      gap: 0.5rem;
   }

   &__color-input {
      flex-shrink: 0;
      width: 2.5rem;
      height: 2.5rem;
   }

   &__range {
      display: flex;
      gap: 0.5rem;
      align-items: center;
   }

   &__range-value {
      padding: 0.25rem 0.5rem;
      font-size: 0.875rem;
      font-weight: 700;
      color: #52525b;
      background-color: #f4f4f5;
      border-radius: 9999px;
   }

   &__checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
   }

   &__checkbox-label {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      padding: 0.5rem;
      cursor: pointer;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      transition: all 0.15s ease-in-out;

      &:has(input:checked) {
         background-color: #eff6ff;
      }

      &:hover input:not(:checked) {
         border-color: #2563eb;
      }

      &:has(input:disabled) {
         cursor: not-allowed;
         opacity: 0.75;
      }
   }

   &__checkbox-input {
      width: 1rem;
      height: 1rem;
      cursor: pointer;
      appearance: none;
      border: 1px solid #e0e0e0;
      border-radius: 0.3125rem;

      &:checked {
         background-color: #1d4ed8;
         border-color: #1d4ed8;
      }

      &:disabled {
         cursor: not-allowed;
      }
   }

   &__checkbox-text {
      font-size: 0.875rem;
   }

   &__radio-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
   }

   &__radio-label {
      display: flex;
      gap: 1rem;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      background-color: #fff;
      border: 1px solid #d1d5db;
      border-radius: 0.25rem;
      box-shadow: 0 1px 2px 0 rgb(0 0 0 / 5%);
      transition: all 0.15s ease-in-out;

      &:hover {
         background-color: #f9fafb;
      }

      &:has(input:checked) {
         border-color: #2563eb;
         box-shadow: 0 0 0 1px #2563eb;
      }
   }

   &__radio-text {
      color: #374151;
   }

   &__toggle {
      position: relative;
      display: block;
      width: 3.25rem;
      height: 1.75rem;
      cursor: pointer;
      background-color: #d1d5db;
      border-radius: 9999px;
      transition: background-color 0.2s ease-in-out;
      -webkit-tap-highlight-color: transparent;

      &:hover {
         background-color: rgb(156 163 175 / 75%);
      }

      &:has(input:checked) {
         background-color: #047857;

         &:hover {
            background-color: #065f46;
         }
      }
   }

   &__toggle-input {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
   }

   &__toggle-handle {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      width: 1.25rem;
      height: 1.25rem;
      margin: 0.25rem;
      background-color: #fff;
      border-radius: 9999px;
      transition: left 0.2s ease-in-out;

      .editor-field-node__toggle:has(input:checked) & {
         left: 1.5rem;
      }
   }

   &__object-fields {
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid #d1d5db;
   }

   &__info {
      margin-top: 0.25rem;
      padding: 0.5rem;
      font-size: 0.875rem;
      color: #52525b;
      background-color: #f4f4f5;
      border-radius: 0.375rem;

      @media (min-width: 768px) {
         padding: 0.75rem;
      }
   }

   &__info-icon {
      float: left;
      width: 1rem;
      height: 1rem;
      margin-top: 0.125rem;
      margin-right: 0.25rem;
   }

   &__error {
      padding: 0.5rem 0.75rem;
      font-size: 0.75rem;
      color: #dc2626;
      background-color: #fef2f2;
      border-radius: 0.125rem;
   }

   // Form control styles
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

      // Select input chevron icon
      &:is(select) {
         padding-right: 32px;
         appearance: none;
         background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
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

   // Screen reader only utility
   .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
   }
}
</style>
