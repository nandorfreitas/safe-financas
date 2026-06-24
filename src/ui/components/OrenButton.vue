<script setup lang="ts">
import { computed } from "vue";
import type { ButtonVariant, Size } from "../types";

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant;
    size?: Size;
    disabled?: boolean;
    loading?: boolean;
    block?: boolean;
    type?: "button" | "submit" | "reset";
  }>(),
  {
    variant: "primary",
    size: "md",
    disabled: false,
    loading: false,
    block: false,
    type: "button",
  },
);

const emit = defineEmits<{ (e: "click", ev: MouseEvent): void }>();

const classes = computed(() => [
  "oren-btn",
  `oren-btn--${props.variant}`,
  `oren-btn--${props.size}`,
  { "oren-btn--block": props.block, "oren-btn--loading": props.loading },
]);

function onClick(ev: MouseEvent) {
  if (props.disabled || props.loading) return;
  emit("click", ev);
}
</script>

<template>
  <button
    :class="classes"
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    @click="onClick"
  >
    <span v-if="loading" class="oren-btn__spinner" aria-hidden="true" />
    <slot />
  </button>
</template>

<style scoped>
.oren-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5em;
  font-family: var(--font-family);
  font-weight: 600;
  line-height: 1.2;
  border: 1px solid transparent;
  border-radius: var(--radius-control);
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, box-shadow 0.15s, filter 0.15s;
}
.oren-btn--block {
  display: flex;
  width: 100%;
}
.oren-btn--sm {
  font-size: 13px;
  padding: 8px 14px;
}
.oren-btn--md {
  font-size: 15px;
  padding: 11px 20px;
}
.oren-btn--lg {
  font-size: 16px;
  padding: 14px 26px;
}
.oren-btn--primary {
  background: var(--action-primary);
  color: var(--action-primary-text);
}
.oren-btn--primary:hover:not(:disabled) {
  background: var(--action-primary-hover);
}
.oren-btn--secondary {
  background: transparent;
  color: var(--action-primary);
  border-color: var(--action-primary);
}
.oren-btn--secondary:hover:not(:disabled) {
  background: rgba(14, 83, 81, 0.08);
}
.oren-btn--ghost {
  background: transparent;
  color: var(--action-primary);
}
.oren-btn--ghost:hover:not(:disabled) {
  background: rgba(14, 83, 81, 0.08);
}
.oren-btn--accent {
  background: var(--accent);
  color: var(--accent-text);
}
.oren-btn--accent:hover:not(:disabled) {
  filter: brightness(0.95);
}
.oren-btn--danger {
  background: var(--feedback-error);
  color: #fff;
}
.oren-btn--danger:hover:not(:disabled) {
  filter: brightness(0.95);
}
.oren-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--focus-ring);
}
.oren-btn:disabled {
  background: var(--gray-200);
  color: var(--gray-500);
  border-color: transparent;
  cursor: not-allowed;
}
.oren-btn--loading {
  cursor: progress;
}
.oren-btn--loading:disabled {
  background: var(--action-primary);
  color: var(--action-primary-text);
}
.oren-btn--secondary.oren-btn--loading:disabled,
.oren-btn--ghost.oren-btn--loading:disabled {
  background: transparent;
  color: var(--action-primary);
}
.oren-btn__spinner {
  width: 1em;
  height: 1em;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: oren-btn-spin 0.7s linear infinite;
}
@keyframes oren-btn-spin {
  to {
    transform: rotate(360deg);
  }
}
[data-theme="dark"] .oren-btn--secondary {
  color: var(--flash-white);
  border-color: rgba(232, 243, 232, 0.5);
}
[data-theme="dark"] .oren-btn--ghost {
  color: var(--flash-white);
}
[data-theme="dark"] .oren-btn--secondary:hover:not(:disabled),
[data-theme="dark"] .oren-btn--ghost:hover:not(:disabled) {
  background: rgba(232, 243, 232, 0.12);
}
@media (prefers-reduced-motion: reduce) {
  .oren-btn__spinner {
    animation-duration: 3s;
  }
}
</style>
