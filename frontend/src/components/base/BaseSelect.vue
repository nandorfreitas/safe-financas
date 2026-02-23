<template>
  <div :class="['base-select', { 'base-select--error': error, 'base-select--disabled': disabled }]">
    <label v-if="label" :for="selectId" class="base-select__label">{{ label }}</label>
    <select
      :id="selectId"
      class="base-select__field"
      :value="modelValue"
      :disabled="disabled"
      @change="$emit('update:modelValue', $event.target.value)"
    >
      <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
      <option v-for="opt in options" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>
    <span v-if="error" class="base-select__error">{{ error }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  options: { type: Array, default: () => [] },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  error: { type: String, default: '' }
})

defineEmits(['update:modelValue'])

const selectId = computed(() => `select-${props.label?.toLowerCase().replace(/\s+/g, '-') || Math.random().toString(36).slice(2)}`)
</script>

<style scoped>
.base-select {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.base-select__label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
}

.base-select__field {
  height: 2.375rem;
  padding: 0 var(--space-3);
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: var(--radius-lg);
  color: var(--input-text);
  font-size: var(--text-sm);
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b6b78' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right var(--space-3) center;
  padding-right: var(--space-8);
  transition: border-color var(--duration-normal) var(--easing-default);
}

.base-select__field:hover:not(:disabled) {
  border-color: var(--input-border-hover);
}

.base-select__field:focus {
  outline: none;
  border-color: var(--input-border-focus);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.12);
}

.base-select--error .base-select__field {
  border-color: var(--color-danger);
}

.base-select--disabled .base-select__field {
  background: var(--input-bg-disabled);
  opacity: 0.5;
  cursor: not-allowed;
}

.base-select__error {
  font-size: var(--text-xs);
  color: var(--color-danger);
}
</style>
