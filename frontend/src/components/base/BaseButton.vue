<template>
  <button
    :class="['base-button', `base-button--${variant}`, `base-button--${size}`, { 'base-button--block': block, 'base-button--loading': loading }]"
    :disabled="disabled || loading"
    :type="type"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="base-button__spinner" />
    <slot />
  </button>
</template>

<script setup>
defineProps({
  variant: { type: String, default: 'primary', validator: v => ['primary', 'secondary', 'danger', 'ghost'].includes(v) },
  size: { type: String, default: 'md', validator: v => ['sm', 'md', 'lg'].includes(v) },
  type: { type: String, default: 'button' },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  block: { type: Boolean, default: false }
})

defineEmits(['click'])
</script>

<style scoped>
.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  font-weight: var(--font-medium);
  border-radius: var(--radius-lg);
  transition: all var(--duration-normal) var(--easing-default);
  cursor: pointer;
  border: 1px solid transparent;
  white-space: nowrap;
  position: relative;
}

.base-button:active:not(:disabled) {
  transform: scale(0.98);
}

.base-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.base-button:disabled:hover {
  transform: none;
}

/* Sizes */
.base-button--sm {
  height: 2rem;
  padding: 0 var(--space-3);
  font-size: var(--text-xs);
}

.base-button--md {
  height: 2.375rem;
  padding: 0 var(--space-4);
  font-size: var(--text-sm);
}

.base-button--lg {
  height: 2.75rem;
  padding: 0 var(--space-6);
  font-size: var(--text-base);
}

/* Variants */
.base-button--primary {
  background: var(--btn-primary-bg);
  color: var(--btn-primary-text);
}
.base-button--primary:hover:not(:disabled) {
  background: var(--btn-primary-bg-hover);
}

.base-button--secondary {
  background: var(--btn-secondary-bg);
  color: var(--btn-secondary-text);
  border-color: var(--btn-secondary-border);
}
.base-button--secondary:hover:not(:disabled) {
  background: var(--btn-secondary-bg-hover);
}

.base-button--danger {
  background: var(--btn-danger-bg);
  color: var(--btn-danger-text);
}
.base-button--danger:hover:not(:disabled) {
  background: var(--btn-danger-bg-hover);
}

.base-button--ghost {
  background: var(--btn-ghost-bg);
  color: var(--btn-ghost-text);
}
.base-button--ghost:hover:not(:disabled) {
  background: var(--btn-ghost-bg-hover);
}

/* Block */
.base-button--block {
  width: 100%;
}

/* Loading */
.base-button--loading {
  color: transparent;
}

.base-button__spinner {
  position: absolute;
  width: 1rem;
  height: 1rem;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: var(--radius-full);
  animation: spin 0.6s linear infinite;
}

.base-button--loading .base-button__spinner {
  color: var(--btn-primary-text);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
