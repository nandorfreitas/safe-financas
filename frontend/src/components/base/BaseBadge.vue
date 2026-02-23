<template>
  <span :class="['base-badge', `base-badge--${variant}`]">
    <slot />
  </span>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'default',
    validator: v => ['default', 'success', 'warning', 'danger', 'info'].includes(v)
  }
})
</script>

<style scoped>
.base-badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-2);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  border-radius: var(--radius-full);
  line-height: 1;
  white-space: nowrap;
}

.base-badge--default {
  background: var(--badge-default-bg);
  color: var(--badge-default-text);
}

.base-badge--success {
  background: var(--color-success-subtle);
  color: var(--color-success);
}

.base-badge--warning {
  background: var(--color-warning-subtle);
  color: var(--color-warning);
}

.base-badge--danger {
  background: var(--color-danger-subtle);
  color: var(--color-danger);
}

.base-badge--info {
  background: var(--color-info-subtle);
  color: var(--color-info);
}
</style>
