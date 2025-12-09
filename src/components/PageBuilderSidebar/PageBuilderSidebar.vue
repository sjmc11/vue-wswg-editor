<template>
   <div class="page-builder-sidebar">
      <!-- Toolbar -->
      <PageBuilderToolbar
         v-model:editorViewport="editorViewport"
         v-model:showPageSettings="showPageSettings"
         v-model:activeBlock="activeBlock"
         class="z-12 sticky top-0 bg-white"
         :hasPageSettings="hasPageSettings"
      />
      <!-- Page settings -->
      <PageSettings
         v-if="showPageSettings"
         v-model="pageData"
         :editable="editable"
         :settingsKey="settingsKey"
         :activeTab="activeSettingsTab"
         @close="showPageSettings = false"
      />
      <!-- Active section-->
      <div v-else-if="activeBlock">
         <!-- back header -->
         <div class="flex items-start justify-between border-b border-gray-300 bg-white p-5">
            <div>
               <button
                  class="cursor-pointer text-sm text-zinc-500 hover:text-zinc-900 hover:underline"
                  @click="activeBlock = null"
               >
                  ← Back
               </button>
               <h4 class="mt-1 text-lg font-bold">{{ computedActiveBlock.label || computedActiveBlock.type }}</h4>
            </div>
            <!-- delete section button -->
            <button
               v-if="activeBlock && editable"
               class="inline-flex size-7 cursor-pointer items-center justify-center rounded-md border border-gray-300 bg-zinc-100 text-zinc-500 hover:border-red-200 hover:bg-red-100 hover:text-red-600"
               title="Delete block"
               @click="handleDeleteBlock"
            >
               <TrashIcon class="size-4" />
            </button>
         </div>
         <BlockEditorFields
            v-model="computedActiveBlock.data"
            :fields="computedActiveBlock.fields"
            :editable="editable"
         />
      </div>
      <!-- Add block menu -->
      <div v-else-if="showAddBlockMenu">
         <div class="flex items-center justify-between border-b border-gray-300 bg-white p-5">
            <div>
               <button
                  class="cursor-pointer text-sm text-zinc-500 hover:text-zinc-900 hover:underline"
                  @click="showAddBlockMenu = false"
               >
                  ← Back
               </button>
               <h4 class="mt-1 text-lg font-bold">Add block</h4>
            </div>
         </div>
         <!-- Blocks list -->
         <BlockBrowser />
      </div>
      <!-- No active block -->
      <div v-else>
         <div class="flex items-center justify-between border-b border-gray-300 bg-white p-5">
            <h4 class="text-lg font-bold">Blocks ({{ pageData?.[blocksKey]?.length }})</h4>
            <button
               v-if="editable"
               class="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-zinc-50 px-3 py-2 text-xs text-zinc-500 hover:border-zinc-400 hover:text-zinc-900 active:border-blue-600 active:bg-blue-50 active:text-blue-600"
               title="Add block"
               @click="handleShowAddBlockMenu"
            >
               <span>Add block</span>
               <PlusIcon class="size-3" />
            </button>
         </div>
         <!-- Blocks list -->
         <PageBlockList
            v-model="pageData"
            v-model:hoveredBlockId="hoveredBlockId"
            :editable="editable"
            :blocksKey="blocksKey"
            :settingsKey="settingsKey"
            @block-click="handleBlockClick"
         />
      </div>
   </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { pageBuilderBlocks } from "../../util/registry";
import type { Block } from "../../types/Block";
import { toCamelCase } from "../../util/helpers";
import BlockBrowser from "../BlockBrowser/BlockBrowser.vue";
import BlockEditorFields from "../BlockEditorFields/BlockEditorFields.vue";
import PageBlockList from "../PageBlockList/PageBlockList.vue";
import PageSettings from "../PageSettings/PageSettings.vue";
import { TrashIcon, PlusIcon } from "@heroicons/vue/24/outline";
import PageBuilderToolbar from "../PageBuilderToolbar/PageBuilderToolbar.vue";
// Models
const pageData = defineModel<any>();
const activeBlock = defineModel<any>("activeBlock");
const hoveredBlockId = defineModel<string | null>("hoveredBlockId");
const showPageSettings = defineModel<boolean>("showPageSettings");
const showAddBlockMenu = defineModel<boolean>("showAddBlockMenu");
const editorViewport = defineModel<"desktop" | "mobile">("editorViewport");

// Props
const props = withDefaults(
   defineProps<{
      editable?: boolean;
      blocksKey?: string;
      settingsKey?: string;
      hasPageSettings?: boolean;
      activeSettingsTab?: string;
   }>(),
   {
      editable: true,
      blocksKey: "blocks",
      settingsKey: "settings",
      hasPageSettings: false,
      activeSettingsTab: undefined,
   }
);

// Reactive merged block data that syncs with activeBlock
const computedActiveBlock = computed(() => {
   if (!activeBlock.value) {
      return null;
   }

   // Get the block type from activeBlock (e.g., "heroSection", "faqSection")
   const blockType = activeBlock.value.type;
   if (!blockType) {
      return activeBlock.value;
   }

   // Find the corresponding block in the registry
   const registryBlock = pageBuilderBlocks.value[toCamelCase(blockType)];

   if (!registryBlock) {
      // If no registry block found, return activeBlock as-is
      return activeBlock.value;
   }

   // Find the actual block object in pageData[blocksKey] to ensure we're updating the source
   const blockId = activeBlock.value.id;
   const actualBlock = pageData.value?.[props.blocksKey]?.find((b: any) => b.id === blockId) || activeBlock.value;

   // Create a proxy that nests all instance data under a 'data' property
   // Registry metadata (name, label, icon, directory, fields) stays at the top level
   return new Proxy({} as any, {
      get(_, prop) {
         // If accessing 'data', return a proxy to the actual block object
         if (prop === "data") {
            return new Proxy(actualBlock, {
               get(target, dataProp) {
                  return target[dataProp as keyof typeof target];
               },
               set(target, dataProp, value) {
                  target[dataProp as keyof typeof target] = value;
                  // Also update activeBlock.value to keep it in sync
                  if (activeBlock.value) {
                     activeBlock.value[dataProp as keyof typeof activeBlock.value] = value;
                  }
                  return true;
               },
               has(target, dataProp) {
                  return dataProp in target;
               },
               ownKeys(target) {
                  return Object.keys(target);
               },
               getOwnPropertyDescriptor(target, dataProp) {
                  return Object.getOwnPropertyDescriptor(target, dataProp);
               },
            });
         }
         // For all other properties, return registry metadata
         return registryBlock[prop as keyof typeof registryBlock];
      },
      set(_, prop) {
         // Only allow setting registry metadata properties (though this shouldn't happen)
         // Instance data should be set via the 'data' property
         if (prop in registryBlock) {
            // Silently ignore attempts to set registry properties
            return true;
         }
         return false;
      },
      has(_, prop) {
         // Check if property exists in registry or if it's 'data'
         return prop === "data" || prop in registryBlock;
      },
      ownKeys() {
         // Return registry keys plus 'data'
         const registryKeys = Object.keys(registryBlock);
         return ["data", ...registryKeys];
      },
      getOwnPropertyDescriptor(_, prop) {
         if (prop === "data") {
            return {
               enumerable: true,
               configurable: true,
            };
         }
         if (prop in registryBlock) {
            return Object.getOwnPropertyDescriptor(registryBlock, prop);
         }
         return undefined;
      },
   });
});

function handleBlockClick(block: Block) {
   activeBlock.value = block;
   hoveredBlockId.value = null;
   showAddBlockMenu.value = false;
   showPageSettings.value = false;
}

function handleShowAddBlockMenu() {
   if (!props.editable) return;
   showAddBlockMenu.value = true;
}

async function handleDeleteBlock() {
   if (!props.editable) return;
   // confirm delete block (native browser confirm)
   const blockName = computedActiveBlock.value?.label || computedActiveBlock.value?.type;
   const confirm = window.confirm(
      `Are you sure you want to delete this ${blockName} block?\n\nThis action cannot be undone.`
   );
   if (!confirm) return;

   // Find the index of the block by matching its id
   const blockId = activeBlock.value?.id;
   if (!blockId || !pageData.value?.[props.blocksKey]) return;

   const blocks = pageData.value[props.blocksKey];
   const blockIndex = blocks.findIndex((block: any) => block.id === blockId);

   if (blockIndex !== -1) {
      blocks.splice(blockIndex, 1);
   }

   activeBlock.value = null;
   hoveredBlockId.value = null;
   showAddBlockMenu.value = false;
}
</script>

<style scoped lang="scss">
$toolbar-height: 0px;

.page-builder-sidebar {
   min-width: 300px;
   background: #fff;
}
</style>
