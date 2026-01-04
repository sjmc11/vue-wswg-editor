<template>
   <div class="section-editor-fields">
      <!-- Field group tabs-->
      <div v-if="editorFieldGroups.length" class="field-group-tabs" :class="{ 'field-group-tabs--nested': nested }">
         <button
            v-for="fieldGroupName in editorFieldGroups"
            :key="`fg_${fieldGroupName}`"
            class="field-group-tab"
            :class="{ 'field-group-tab--active': activeFieldGroup === fieldGroupName }"
            @click="activeFieldGroup = fieldGroupName"
         >
            {{ fieldGroupName }}
         </button>
      </div>

      <!-- Fields -->
      <div
         v-if="blockData && Object.keys(editorFields).length > 0"
         class="fields-container"
         :class="{ 'fields-container--nested': nested }"
      >
         <div v-for="(fieldConfig, fieldName) in editorFields" :key="fieldName" class="prop-field">
            <BlockEditorFieldNode
               v-model="blockData[fieldName]"
               :fieldConfig="fieldConfig"
               :fieldName="fieldName"
               :editable="editable"
            />
         </div>
      </div>

      <!-- No fields -->
      <div v-else class="fields-container" :class="{ 'fields-container--nested': nested }">
         <div class="no-fields-message">
            <p>
               {{ isLayoutBlock ? "No settings available for this layout." : "No options available for this block." }}
            </p>
         </div>
      </div>
   </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeMount, watch } from "vue";
import BlockEditorFieldNode from "../BlockEditorFieldNode/BlockEditorFieldNode.vue";
import type { EditorFieldConfig } from "../../util/fieldConfig";

const blockData = defineModel<any>();
const activeFieldGroup = ref<string>("");
const { fields, editable, activeTab } = defineProps<{
   fields?: Record<string, EditorFieldConfig>;
   editable: boolean;
   isLayoutBlock?: boolean;
   nested?: boolean;
   activeTab?: string;
}>();

const editorFields = computed(() => {
   // If no groups, return all fields
   if (!editorFieldGroups.value.length) return fields || {};
   // If an active field group is set, return only the fields in that group
   if (fields && Object.keys(fields).length > 0) {
      return Object.fromEntries(Object.entries(fields).filter(([_, field]) => field?.group === activeFieldGroup.value));
   }
   // If no active field group is set, return all fields
   return fields || {};
});

// Return unique string[] of unique field groups
const editorFieldGroups = computed(() => {
   // If there are no fields, return an empty array
   if (!fields || Object.keys(fields).length === 0) return [];

   // If the fields do not have any groups, return empty array
   if (!Object.keys(fields).some((field) => fields[field]?.group)) return [];

   return Object.keys(fields).reduce((acc, field) => {
      const fieldGroup = fields[field]?.group;
      if (fieldGroup && !acc.includes(fieldGroup)) {
         acc.push(fieldGroup);
      }
      return acc;
   }, [] as string[]);
});

watch(editorFieldGroups, () => {
   if (editorFieldGroups.value.length > 0) {
      // If activeTab prop is provided and exists in groups, use it; otherwise use first group
      if (activeTab && editorFieldGroups.value.includes(activeTab)) {
         activeFieldGroup.value = activeTab;
      } else {
         activeFieldGroup.value = editorFieldGroups.value[0] || "";
      }
   }
});

watch(
   () => activeTab,
   (newTab) => {
      if (newTab && editorFieldGroups.value.includes(newTab)) {
         activeFieldGroup.value = newTab;
      }
   }
);

onBeforeMount(() => {
   if (editorFieldGroups.value.length > 0) {
      // If activeTab prop is provided and exists in groups, use it; otherwise use first group
      if (activeTab && editorFieldGroups.value.includes(activeTab)) {
         activeFieldGroup.value = activeTab;
      } else {
         activeFieldGroup.value = editorFieldGroups.value[0] || "";
      }
   }
});
</script>

<style scoped lang="scss">
.field-group-tabs {
   display: flex;
   gap: 0.5rem;
   overflow-x: auto;
   padding: 0.75rem 1.25rem 0;
   border-bottom: 1px solid #d1d5db;

   &--nested {
      padding: 0;
   }
}

.field-group-tab {
   padding: 0.4375rem 0.875rem;
   font-size: 0.8125rem;
   border: 1px solid #e4e4e7;
   border-radius: 0.3125rem 0.3125rem 0 0;
   background-color: #f4f4f5;

   &::first-letter {
      text-transform: uppercase;
   }

   &--active {
      border-bottom-color: transparent;
      background-color: #fff;
   }
}

.fields-container {
   display: flex;
   flex-direction: column;
   gap: 0.75rem;
   padding: 1.25rem;

   &--nested {
      padding: 0;
   }
}

.no-fields-message {
   padding: 0.75rem 1rem;
   font-size: 0.875rem;
   font-weight: 500;
   color: #52525b;
   background-color: #f4f4f5;
   border-radius: 0.5rem;
}
</style>
