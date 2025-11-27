<template>
   <div id="page-blocks-wrapper">
      <div v-for="block in pageBlocks" :key="block.id">
         <component :is="getBlockComponent(block.type)" v-bind="block" :key="`block-${block.id}`" />
      </div>
   </div>
</template>

<script setup lang="ts">
import { getBlockComponent } from "../../util/registry";
import { computed } from "vue";

const props = defineProps<{
   pageData: any;
   blocksKey: string;
}>();

const pageBlocks = computed(() => {
   return props.pageData[props.blocksKey] || undefined;
});
</script>

<style scoped lang="scss"></style>
