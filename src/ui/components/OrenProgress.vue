<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{ value?: number; variant?: "primary" | "accent" }>(),
  { value: 0, variant: "primary" },
);

const pct = computed(() => Math.max(0, Math.min(100, props.value)));
</script>

<template>
  <div
    :class="['oren-progress', `oren-progress--${variant}`]"
    role="progressbar"
    :aria-valuenow="pct"
    aria-valuemin="0"
    aria-valuemax="100"
  >
    <span :style="{ width: pct + '%' }" />
  </div>
</template>

<style scoped>
.oren-progress {
  width: 100%;
  height: 8px;
  background: var(--gray-200);
  border-radius: var(--radius-pill);
  overflow: hidden;
}
.oren-progress span {
  display: block;
  height: 100%;
  border-radius: var(--radius-pill);
  background: var(--action-primary);
  transition: width 0.3s ease;
}
.oren-progress--accent span {
  background: var(--green-soft);
}
@media (prefers-reduced-motion: reduce) {
  .oren-progress span {
    transition: none;
  }
}
</style>
