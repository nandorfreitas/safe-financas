<script setup lang="ts">
import { computed } from "vue";
import type { Feedback } from "../types";

const props = withDefaults(
  defineProps<{ type?: Feedback; title?: string }>(),
  { type: "info" },
);

const icon = computed(
  () => ({ success: "✓", error: "!", warning: "▲", info: "i" })[props.type],
);
</script>

<template>
  <div :class="['oren-alert', `oren-alert--${type}`]" role="alert">
    <span class="oren-alert__icon" aria-hidden="true">{{ icon }}</span>
    <div class="oren-alert__body">
      <p v-if="title" class="oren-alert__title">{{ title }}</p>
      <div class="oren-alert__text"><slot /></div>
    </div>
  </div>
</template>

<style scoped>
.oren-alert {
  display: flex;
  gap: 11px;
  padding: 13px 15px;
  border-radius: var(--radius);
  font-family: var(--font-family);
  font-size: 14px;
  border: 1px solid;
}
.oren-alert__icon {
  font-weight: 700;
  flex: none;
}
.oren-alert__title {
  font-weight: 600;
  margin: 0 0 2px;
}
.oren-alert--success {
  background: #e3f6ec;
  border-color: #b6e6c8;
  color: #0f5a30;
}
.oren-alert--error {
  background: #fdeceb;
  border-color: #f6c9c5;
  color: #8f2018;
}
.oren-alert--warning {
  background: #fdf3df;
  border-color: #f0deae;
  color: #6e5000;
}
.oren-alert--info {
  background: #e7f0fc;
  border-color: #c3d8f5;
  color: #1a4787;
}
</style>
