<template>
  <label :class="['base-switch', { 'base-switch--disabled': disabled }]">
    <input
      type="checkbox"
      class="base-switch__input"
      :checked="modelValue"
      :disabled="disabled"
      @change="$emit('update:modelValue', $event.target.checked)"
    />
    <span class="base-switch__track">
      <span class="base-switch__thumb" />
    </span>
    <span v-if="label" class="base-switch__label">{{ label }}</span>
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
.base-switch {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  user-select: none;
}

.base-switch__input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.base-switch__track {
  width: 2.5rem;
  height: 1.375rem;
  background: var(--bg-subtle);
  border-radius: var(--radius-full);
  position: relative;
  transition: background var(--duration-normal) var(--easing-default);
  flex-shrink: 0;
}

.base-switch__thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 1.125rem;
  height: 1.125rem;
  background: var(--color-neutral-0);
  border-radius: var(--radius-full);
  transition: transform var(--duration-normal) var(--easing-spring);
  box-shadow: var(--shadow-sm);
}

.base-switch__input:checked + .base-switch__track {
  background: var(--btn-primary-bg);
}

.base-switch__input:checked + .base-switch__track .base-switch__thumb {
  transform: translateX(1.125rem);
}

.base-switch__input:focus-visible + .base-switch__track {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}

.base-switch__label {
  font-size: var(--text-sm);
  color: var(--text-primary);
}

.base-switch--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
