<script setup lang="ts">
import { useSlots } from "vue";

withDefaults(
  defineProps<{
    /** Kicker UPPERCASE acima do título. */
    eyebrow?: string;
    title: string;
    subtitle?: string;
  }>(),
  {},
);

const slots = useSlots();
</script>

<template>
  <header class="oren-pagehead">
    <div class="oren-pagehead__main">
      <div v-if="eyebrow" class="oren-pagehead__eyebrow">{{ eyebrow }}</div>
      <h1 class="oren-pagehead__title">{{ title }}</h1>
      <p v-if="subtitle" class="oren-pagehead__subtitle">{{ subtitle }}</p>
    </div>
    <div v-if="slots.actions" class="oren-pagehead__actions"><slot name="actions" /></div>
  </header>
</template>

<style scoped>
.oren-pagehead {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  font-family: var(--font-family);
  padding-bottom: 18px;
  border-bottom: 1px solid var(--border-default);
}
.oren-pagehead__eyebrow {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--action-primary-hover);
  margin-bottom: 8px;
}
[data-theme="dark"] .oren-pagehead__eyebrow {
  color: var(--green-soft);
}
.oren-pagehead__title {
  font-size: 28px;
  font-weight: 300;
  letter-spacing: -0.02em;
  color: var(--text-default);
  margin: 0;
}
.oren-pagehead__subtitle {
  font-size: 14px;
  color: var(--text-muted);
  margin: 6px 0 0;
}
.oren-pagehead__actions {
  display: flex;
  gap: 10px;
  flex: none;
}
</style>
