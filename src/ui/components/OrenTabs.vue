<script setup lang="ts">
import type { TabItem } from "../types";

defineProps<{ modelValue: string; tabs: TabItem[] }>();
defineEmits<{ (e: "update:modelValue", value: string): void }>();
</script>

<template>
  <div class="oren-tabs-wrap">
    <div class="oren-tabs" role="tablist">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        class="oren-tab"
        :class="{ 'oren-tab--active': modelValue === tab.value }"
        role="tab"
        :aria-selected="modelValue === tab.value"
        @click="$emit('update:modelValue', tab.value)"
      >
        {{ tab.label }}
      </button>
    </div>
    <div class="oren-tabpane" role="tabpanel">
      <slot :name="modelValue" />
    </div>
  </div>
</template>

<style scoped>
.oren-tabs-wrap {
  font-family: var(--font-family);
}
.oren-tabs {
  display: flex;
  gap: 2px;
  border-bottom: 1px solid var(--border-default);
  margin-bottom: 16px;
}
.oren-tab {
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  background: none;
  border: none;
  padding: 10px 16px;
  cursor: pointer;
  color: var(--text-muted);
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}
.oren-tab:hover {
  color: var(--text-default);
}
.oren-tab--active {
  color: var(--action-primary);
  border-bottom-color: var(--action-primary);
  font-weight: 600;
}
.oren-tabpane {
  font-size: 14px;
  color: var(--text-default);
}
[data-theme="dark"] .oren-tab--active {
  color: var(--green-light);
  border-bottom-color: var(--green-light);
}
</style>
