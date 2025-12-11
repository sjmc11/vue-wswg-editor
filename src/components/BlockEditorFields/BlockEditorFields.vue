<template>
   <div class="section-editor-fields">
      <!-- Field group tabs-->
      <div
         v-if="editorFieldGroups.length"
         class="field-group-tabs flex gap-2 overflow-x-auto border-b border-gray-300"
         :class="nested ? 'px-0 pt-0' : 'px-5 pt-3'"
      >
         <button
            v-for="fieldGroupName in editorFieldGroups"
            :key="`fg_${fieldGroupName}`"
            class="field-group-tab rounded-t-md border border-zinc-200 bg-zinc-100 px-4 py-2 text-sm first-letter:uppercase"
            :class="{ 'bg-zinc-00 border-b-transparent !bg-white': activeFieldGroup === fieldGroupName }"
            @click="activeFieldGroup = fieldGroupName"
         >
            {{ fieldGroupName }}
         </button>
      </div>

      <!-- Fields -->
      <div
         v-if="blockData && Object.keys(editorFields).length > 0"
         class="flex flex-col gap-3"
         :class="nested ? 'p-0' : 'p-5'"
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
      <div v-else :class="nested ? 'p-0' : 'p-5'">
         <div class="rounded-lg bg-zinc-100 px-4 py-3 text-sm font-medium text-zinc-600">
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
