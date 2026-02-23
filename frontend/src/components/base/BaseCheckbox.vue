<template>
  <label :class="['base-checkbox', { 'base-checkbox--disabled': disabled }]">
    <input
      type="checkbox"
      class="base-checkbox__input"
      :checked="modelValue"
      :disabled="disabled"
      @change="$emit('update:modelValue', $event.target.checked)"
    />
    <span class="base-checkbox__check">
      <svg viewBox="0 0 12 12" fill="none" class="base-checkbox__icon">
        <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </span>
    <span v-if="label" class="base-checkbox__label">{{ label }}</span>
  </label>
</template>

<script setup>
defineProps({
  modelValue: { type: Boolean, default: false },
  label: { type: String, default: '' },
  disabled: { type: Boolean, default: false }
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.base-checkbox {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  user-select: none;
}

.base-checkbox__input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.base-checkbox__check {
  width: 1.125rem;
  height: 1.125rem;
  border: 1.5px solid var(--input-border);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--duration-normal) var(--easing-default);
  background: var(--input-bg);
  flex-shrink: 0;
}

.base-checkbox__icon {
  width: 0.75rem;
  height: 0.75rem;
  opacity: 0;
  transform: scale(0.5);
  transition: all var(--duration-normal) var(--easing-spring);
  color: var(--btn-primary-text);
}

.base-checkbox__input:checked + .base-checkbox__check {
  background: var(--btn-primary-bg);
  border-color: var(--btn-primary-bg);
}

.base-checkbox__input:checked + .base-checkbox__check .base-checkbox__icon {
  opacity: 1;
  transform: scale(1);
}

.base-checkbox__input:focus-visible + .base-checkbox__check {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}

.base-checkbox__label {
  font-size: var(--text-sm);
  color: var(--text-primary);
}

.base-checkbox--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
