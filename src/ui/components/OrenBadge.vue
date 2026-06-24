<script setup lang="ts">
import type { BadgeVariant } from "../types";

withDefaults(defineProps<{ variant?: BadgeVariant }>(), {
  variant: "soft",
});
</script>

<template>
  <span :class="['oren-badge', `oren-badge--${variant}`]"><slot /></span>
</template>

<style scoped>
.oren-badge {
  display: inline-block;
  font-family: var(--font-family);
  font-size: 12px;
  font-weight: 600;
  padding: 4px 11px;
  border-radius: var(--radius-pill);
}
.oren-badge--soft {
  background: #d6f4ec;
  color: #0c5a4c;
}
.oren-badge--accent {
  background: var(--accent);
  color: var(--accent-text);
}
.oren-badge--success {
  background: #e3f6ec;
  color: #0f7a40;
}
.oren-badge--error {
  background: #fdeceb;
  color: #b42318;
}
.oren-badge--warning {
  background: #fdf3df;
  color: #8a6300;
}
.oren-badge--info {
  background: #e7f0fc;
  color: #1f5bb0;
}
.oren-badge--neutral {
  background: var(--gray-200);
  color: var(--gray-700);
}
</style>
