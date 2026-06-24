<script setup lang="ts">
import { useSlots } from "vue";

withDefaults(defineProps<{ title?: string }>(), {});
const slots = useSlots();
</script>

<template>
  <div class="oren-card">
    <div v-if="slots.media" class="oren-card__media"><slot name="media" /></div>
    <div class="oren-card__body">
      <h3 v-if="title || slots.title" class="oren-card__title">
        <slot name="title">{{ title }}</slot>
      </h3>
      <div class="oren-card__content"><slot /></div>
      <div v-if="slots.footer" class="oren-card__footer"><slot name="footer" /></div>
    </div>
  </div>
</template>

<style scoped>
.oren-card {
  font-family: var(--font-family);
  border: 1px solid var(--border-default);
  border-radius: var(--radius);
  overflow: hidden;
  background: var(--surface-default);
  color: var(--text-default);
}
.oren-card__media {
  height: 90px;
  background: var(--green-itaville);
}
.oren-card__body {
  padding: 18px;
}
.oren-card__title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px;
}
.oren-card__content {
  font-size: 14px;
  color: var(--text-muted);
}
.oren-card__footer {
  margin-top: 14px;
}
</style>
