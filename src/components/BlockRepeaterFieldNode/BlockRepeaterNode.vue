<template>
   <div class="repeater-field">
      <div v-if="fieldValue.length === 0" class="empty-state bg-zinc-50 px-4 py-5 text-center text-sm text-neutral-500">
         <p class="underline underline-offset-2">No items yet.</p>
         <button
            v-if="editable"
            :disabled="!!(fieldConfig.maxItems && fieldValue.length >= fieldConfig.maxItems)"
            class="mx-auto mt-4 flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-sm text-blue-500 transition-all duration-200 hover:bg-blue-100 hover:text-blue-700"
            @click="addItem"
         >
            <span>Add item</span>
            <span>+</span>
         </button>
         <p v-else class="text-sm text-neutral-500">Enter edit mode to add items.</p>
      </div>

      <div v-else class="repeater-items space-y-2">
         <div
            v-for="(item, index) in fieldValue"
            :key="`${fieldName}-item-${index}`"
            class="repeater-item overflow-hidden rounded-lg border bg-white hover:border-zinc-300 hover:shadow-sm"
            :class="{ 'is-open': openRepeaterItems.includes(item.id) }"
         >
            <div class="repeater-item-header flex items-center gap-2 bg-zinc-50 p-3">
               <button
                  class="text-zinc-500 hover:text-zinc-700"
                  title="Toggle item"
                  @click="toggleRepeaterItem(item.id)"
               >
                  <ChevronDownIcon v-if="!openRepeaterItems.includes(item.id)" class="size-4" />
                  <ChevronUpIcon v-else class="size-4" />
               </button>
               <h4 class="mr-auto text-sm font-medium text-gray-700">
                  <span v-if="fieldConfig.repeaterFieldLabel">
                     {{ item[fieldConfig.repeaterFieldLabel] || `Item ${index + 1}` }}
                  </span>
                  <span v-else> Item {{ index + 1 }} </span>
               </h4>
               <div v-if="editable" class="flex items-center gap-2">
                  <button v-if="index > 0" :disabled="!editable" title="Move item up" @click="moveItemUp(index)">
                     <BarsArrowUpIcon class="size-4" />
                  </button>
                  <button v-if="index < fieldValue.length - 1" title="Move item down" @click="moveItemDown(index)">
                     <BarsArrowDownIcon class="size-4" />
                  </button>
                  <button class="text-red-600 hover:text-red-700" title="Remove item" @click="removeItem(index)">
                     <XMarkIcon class="size-4" />
                  </button>
               </div>
            </div>

            <div class="repeater-item-fields flex flex-col gap-3">
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

      <div class="mt-3 flex justify-between gap-2">
         <div
            v-if="fieldConfig.minItems && fieldValue.length === fieldConfig.minItems"
            class="mt-2 text-xs text-amber-600"
         >
            Minimum {{ fieldConfig.minItems }} item{{ fieldConfig.minItems > 1 ? "s" : "" }} required
         </div>
         <div
            v-if="fieldConfig.maxItems && fieldValue.length >= fieldConfig.maxItems"
            class="mt-2 text-xs text-amber-600"
         >
            Maximum {{ fieldConfig.maxItems }} item{{ fieldConfig.maxItems > 1 ? "s" : "" }} allowed
         </div>

         <button
            v-if="editable && fieldValue.length"
            :disabled="canAddItem"
            class="ml-auto mt-1 flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-sm text-blue-500 transition-all duration-200 hover:bg-blue-100 hover:text-blue-700"
            :class="{ 'cursor-not-allowed opacity-50': canAddItem }"
            @click="addItem"
         >
            <span>Add item</span>
            <PlusIcon class="size-4" />
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
   fieldValue.value = fieldValue.value.map((item) => ({
      id: item.id || crypto.randomUUID(),
      ...item,
   }));
});

// Helper function to get default value for a field
function getDefaultValue(fieldConfig: EditorFieldConfig): any {
   const textBasedFields = ["text", "textarea", "email", "url", "richText"];
   if (textBasedFields.includes(fieldConfig.type)) {
      return fieldConfig.default !== undefined ? fieldConfig.default : null;
   }
   return fieldConfig.default;
}

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
}

.empty-state {
   border: 2px dashed #e5e7eb;
   border-radius: 0.5rem;
}

.repeater-item {
   .repeater-item-fields {
      height: 0;
      overflow: hidden;
   }
   &.is-open {
      .repeater-item-fields {
         @apply p-3 h-auto border-t;
      }
   }
}
</style>
