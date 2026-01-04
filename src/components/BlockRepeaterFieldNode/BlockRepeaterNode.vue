<template>
   <div class="repeater-field">
      <div v-if="fieldValue.length === 0" class="empty-state">
         <p class="empty-state__text">No items yet.</p>
         <button
            v-if="editable"
            :disabled="!!(fieldConfig.maxItems && fieldValue.length >= fieldConfig.maxItems)"
            class="repeater-field__add-btn"
            @click="addItem"
         >
            <span>Add item</span>
            <span>+</span>
         </button>
         <p v-else class="empty-state__help-text">Enter edit mode to add items.</p>
      </div>

      <div v-else class="repeater-items">
         <div
            v-for="(item, index) in fieldValue"
            :key="`${fieldName}-item-${index}`"
            class="repeater-item"
            :class="{ 'is-open': openRepeaterItems.includes(item.id) }"
         >
            <div class="repeater-item-header">
               <button class="repeater-item-header__toggle" title="Toggle item" @click="toggleRepeaterItem(item.id)">
                  <ChevronDownIcon v-if="!openRepeaterItems.includes(item.id)" class="repeater-item-header__icon" />
                  <ChevronUpIcon v-else class="repeater-item-header__icon" />
               </button>
               <h4 class="repeater-item-header__title">
                  <span v-if="fieldConfig.repeaterFieldLabel">
                     {{ item[fieldConfig.repeaterFieldLabel] || `Item ${index + 1}` }}
                  </span>
                  <span v-else> Item {{ index + 1 }} </span>
               </h4>
               <div v-if="editable" class="repeater-item-header__actions">
                  <button
                     v-if="index > 0"
                     :disabled="!editable"
                     class="repeater-item-header__action-btn"
                     title="Move item up"
                     @click="moveItemUp(index)"
                  >
                     <BarsArrowUpIcon class="repeater-item-header__action-icon" />
                  </button>
                  <button
                     v-if="index < fieldValue.length - 1"
                     class="repeater-item-header__action-btn"
                     title="Move item down"
                     @click="moveItemDown(index)"
                  >
                     <BarsArrowDownIcon class="repeater-item-header__action-icon" />
                  </button>
                  <button
                     class="repeater-item-header__action-btn repeater-item-header__action-btn--danger"
                     title="Remove item"
                     @click="removeItem(index)"
                  >
                     <XMarkIcon class="repeater-item-header__action-icon" />
                  </button>
               </div>
            </div>

            <div class="repeater-item-fields">
               <template
                  v-for="(subFieldConfig, subFieldName) in fieldConfig.repeaterFields"
                  :key="`${fieldName}-${index}-${subFieldName}`"
               >
                  <BlockEditorFieldNode
                     v-model="fieldValue[index][subFieldName]"
                     :fieldConfig="subFieldConfig"
                     :fieldName="subFieldName"
                     :editable="editable"
                  />
               </template>
            </div>
         </div>
      </div>

      <div class="repeater-field__footer">
         <div v-if="fieldConfig.minItems && fieldValue.length === fieldConfig.minItems" class="repeater-field__warning">
            Minimum {{ fieldConfig.minItems }} item{{ fieldConfig.minItems > 1 ? "s" : "" }} required
         </div>
         <div v-if="fieldConfig.maxItems && fieldValue.length >= fieldConfig.maxItems" class="repeater-field__warning">
            Maximum {{ fieldConfig.maxItems }} item{{ fieldConfig.maxItems > 1 ? "s" : "" }} allowed
         </div>

         <button
            v-if="editable && fieldValue.length"
            :disabled="canAddItem"
            class="repeater-field__add-btn"
            :class="{ 'repeater-field__add-btn--disabled': canAddItem }"
            @click="addItem"
         >
            <span>Add item</span>
            <PlusIcon class="repeater-field__add-icon" />
         </button>
      </div>
   </div>
</template>

<script setup lang="ts">
import { ref, onBeforeMount, computed } from "vue";
import BlockEditorFieldNode from "../BlockEditorFieldNode/BlockEditorFieldNode.vue";
import type { EditorFieldConfig } from "../../util/fieldConfig";
import {
   BarsArrowDownIcon,
   BarsArrowUpIcon,
   XMarkIcon,
   PlusIcon,
   ChevronDownIcon,
   ChevronUpIcon,
} from "@heroicons/vue/24/outline";

const props = defineProps<{
   fieldConfig: EditorFieldConfig;
   fieldName: string;
   editable: boolean;
}>();

const fieldValueModel = defineModel<any[]>();

// Wrap fieldValue with default value handling
const fieldValue = computed({
   get: () => fieldValueModel.value ?? [],
   set: (value) => {
      fieldValueModel.value = value;
   },
});

// Track open repeater items
const openRepeaterItems = ref<string[]>([]);

// Ensure fieldValue is always an array with id attribute
onBeforeMount(() => {
   // Ensure fieldValue is an array before calling map
   if (!Array.isArray(fieldValue.value)) {
      fieldValue.value = [];
   }
   fieldValue.value =
      fieldValue.value?.map((item) => ({
         id: item.id || crypto.randomUUID(),
         ...item,
      })) ?? [];
});

function addItem() {
   if (props.fieldConfig.maxItems && fieldValue.value.length >= props.fieldConfig.maxItems) {
      return;
   }
   const itemId = crypto.randomUUID();
   // Merge the default value with the new item
   const defaultValues = typeof props.fieldConfig.default === "object" ? props.fieldConfig.default : {};
   const newItem = { id: itemId, ...defaultValues };

   // Create a new array reference to ensure reactivity
   fieldValue.value = [...fieldValue.value, newItem];
   openRepeaterItems.value.push(itemId);
}

function removeItem(index: number) {
   if (props.fieldConfig.minItems && fieldValue.value.length <= props.fieldConfig.minItems) {
      return;
   }
   const itemId = fieldValue.value[index]?.id;
   // Create a new array reference to ensure reactivity
   fieldValue.value = fieldValue.value.filter((_, i) => i !== index);
   if (itemId) {
      openRepeaterItems.value = openRepeaterItems.value.filter((item) => item !== itemId);
   }
}

function moveItemUp(index: number) {
   if (index > 0) {
      const newArray = [...fieldValue.value];
      const [item] = newArray.splice(index, 1);
      newArray.splice(index - 1, 0, item);
      // Create a new array reference to ensure reactivity
      fieldValue.value = newArray;
   }
}

function moveItemDown(index: number) {
   if (index < fieldValue.value.length - 1) {
      const newArray = [...fieldValue.value];
      const [item] = newArray.splice(index, 1);
      newArray.splice(index + 1, 0, item);
      // Create a new array reference to ensure reactivity
      fieldValue.value = newArray;
   }
}

function toggleRepeaterItem(itemId: string) {
   if (openRepeaterItems.value.includes(itemId)) {
      openRepeaterItems.value = openRepeaterItems.value.filter((item) => item !== itemId);
   } else {
      openRepeaterItems.value.push(itemId);
   }
}

const canAddItem = computed(() => {
   return !props.editable || !!(props.fieldConfig.maxItems && fieldValue.value.length >= props.fieldConfig.maxItems);
});
</script>

<style scoped lang="scss">
.repeater-field {
   width: 100%;

   &__add-btn {
      display: flex;
      gap: 0.25rem;
      align-items: center;
      margin-left: auto;
      margin-top: 0.25rem;
      padding: 0.375rem 0.625rem;
      font-size: 0.875rem;
      color: #3b82f6;
      cursor: pointer;
      border: 1px solid #bfdbfe;
      border-radius: 0.375rem;
      background-color: #eff6ff;
      transition: all 0.2s ease-in-out;

      &:hover:not(:disabled) {
         color: #1d4ed8;
         background-color: #dbeafe;
      }

      &--disabled {
         cursor: not-allowed;
         opacity: 0.5;
      }
   }

   &__add-icon {
      width: 1rem;
      height: 1rem;
   }

   &__footer {
      display: flex;
      justify-content: space-between;
      gap: 0.5rem;
      margin-top: 0.75rem;
   }

   &__warning {
      margin-top: 0.5rem;
      font-size: 0.75rem;
      color: #d97706;
   }
}

.empty-state {
   padding: 1.25rem 1rem;
   font-size: 0.875rem;
   color: #737373;
   text-align: center;
   background-color: #fafafa;
   border: 2px dashed #e5e7eb;
   border-radius: 0.5rem;

   &__text {
      text-decoration: underline;
      text-underline-offset: 2px;
   }

   .repeater-field__add-btn {
      margin-left: auto;
      margin-right: auto;
      margin-top: 1rem;
   }

   &__help-text {
      font-size: 0.875rem;
      color: #737373;
   }
}

.repeater-items {
   display: flex;
   flex-direction: column;
   gap: 0.5rem;
}

.repeater-item {
   overflow: hidden;
   border: 1px solid #d1d5db;
   border-radius: 0.5rem;
   background-color: #fff;
   transition: all 0.15s ease-in-out;

   &:hover {
      border-color: #d4d4d8;
      box-shadow: 0 1px 2px 0 rgb(0 0 0 / 5%);
   }

   .repeater-item-fields {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      height: 0;
      overflow: hidden;
   }

   &.is-open {
      .repeater-item-fields {
         height: auto;
         padding: 1rem;
         border-top: 1px solid #e5e7eb;
      }
   }
}

.repeater-item-header {
   display: flex;
   gap: 0.5rem;
   align-items: center;
   padding: 0.75rem;
   background-color: #fafafa;

   &__toggle {
      color: #71717a;
      cursor: pointer;
      transition: color 0.15s ease-in-out;

      &:hover {
         color: #3f3f46;
      }
   }

   &__icon {
      width: 1rem;
      height: 1rem;
   }

   &__title {
      margin-right: auto;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
   }

   &__actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
   }

   &__action-btn {
      color: #71717a;
      cursor: pointer;
      transition: color 0.15s ease-in-out;

      &:hover {
         color: #3f3f46;
      }

      &--danger {
         color: #dc2626;

         &:hover {
            color: #b91c1c;
         }
      }
   }

   &__action-icon {
      width: 1rem;
      height: 1rem;
   }
}
</style>
