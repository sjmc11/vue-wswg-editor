<template>
   <div class="page-settings">
      <div class="page-settings__header">
         <div>
            <button class="page-settings__back-btn" @click="emit('close')">← Back</button>
            <h4 class="page-settings__title">Page settings</h4>
         </div>
      </div>
      <div v-if="availableLayouts.length > 1" class="page-settings__section">
         <!-- Page layout -->
         <div class="editor-field-node">
            <!-- Label -->
            <div class="page-settings__field-label">
               <label>Page layout</label>
            </div>

            <select v-model="pageData[settingsKey].layout" class="page-settings__select" @change="getLayoutSettings">
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
import { themeLayouts } from "../../util/theme-registry";
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
   return Object.values(themeLayouts.value) || [];
});

function getLayoutSettings() {
   const activeLayout = pageData.value[props.settingsKey].layout;
   if (!activeLayout) return;
   pageSettingsFields.value = themeLayouts.value[activeLayout]?.fields || null;
}

onBeforeMount(() => {
   if (!pageData.value[props.settingsKey]) {
      pageData.value[props.settingsKey] = {};
   }
});

onMounted(() => {
   getLayoutSettings();
});
</script>

<style scoped lang="scss">
.page-settings {
   &__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 1.25rem;
      border-bottom: 1px solid #d1d5db;
      background-color: #ffffff;
   }

   &__back-btn {
      cursor: pointer;
      font-size: 0.875rem;
      color: #71717a;

      &:hover {
         color: #18181b;
         text-decoration: underline;
      }
   }

   &__title {
      margin-top: 0.25rem;
      font-size: 1.125rem;
      font-weight: 700;
   }

   &__section {
      padding: 1.25rem;
      border-bottom: 1px solid #d1d5db;
   }

   &__field-label {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      margin-bottom: 0.375rem;

      label {
         margin-right: auto;
         font-weight: 500;

         &::first-letter {
            text-transform: uppercase;
         }
      }
   }

   &__select {
      width: 100%;
      padding: 0.5rem;
      padding-right: 32px;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      appearance: none;
      background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 8px center;
      background-size: 20px;
   }
}
</style>
