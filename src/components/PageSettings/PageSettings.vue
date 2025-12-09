<template>
   <div class="page-settings">
      <div class="flex items-start justify-between border-b border-gray-300 bg-white p-5">
         <div>
            <button
               class="cursor-pointer text-sm text-zinc-500 hover:text-zinc-900 hover:underline"
               @click="emit('close')"
            >
               ← Back
            </button>
            <h4 class="mt-1 text-lg font-bold">Page settings</h4>
         </div>
      </div>
      <div class="border-b border-gray-300 p-5">
         <!-- Page layout -->
         <div class="editor-field-node">
            <!-- Label -->
            <div class="mb-1.5 flex items-center gap-1.5">
               <label class="mr-auto font-medium first-letter:uppercase">Page layout</label>
            </div>

            <select
               v-model="pageData[settingsKey].layout"
               class="form-control w-full rounded-md border border-gray-300 p-2"
               @change="getLayoutSettings"
            >
               <option v-for="layout in availableLayouts" :key="`layout-${layout.__name}`" :value="layout.__name">
                  {{ layout.label }}
               </option>
            </select>
         </div>
      </div>
      <!-- Page settings -->
      <div class="editor-field-node">
         <BlockEditorFields
            v-model="pageData[settingsKey]"
            :fields="pageSettingsFields"
            :editable="true"
            :isLayoutBlock="true"
            :activeTab="activeTab"
         />
      </div>
   </div>
</template>

<script setup lang="ts">
import { computed, onBeforeMount, onMounted, ref } from "vue";
import { getLayoutFields, getLayouts } from "../../util/registry";
import BlockEditorFields from "../BlockEditorFields/BlockEditorFields.vue";

const emit = defineEmits<{
   (e: "close"): void;
}>();

const pageData = defineModel<any>();
const pageSettingsFields = ref<any>({});

const props = withDefaults(
   defineProps<{
      settingsKey?: string;
      activeTab?: string;
   }>(),
   {
      settingsKey: "settings",
      activeTab: undefined,
   }
);
const availableLayouts = computed(() => {
   return getLayouts();
});

function getLayoutSettings() {
   if (!pageData.value[props.settingsKey].layout) return;
   pageSettingsFields.value = getLayoutFields(pageData.value[props.settingsKey].layout) || null;
}

onBeforeMount(() => {
   if (!pageData.value[props.settingsKey]) {
      pageData.value.settings = null;
   }
});

onMounted(() => {
   getLayoutSettings();
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
