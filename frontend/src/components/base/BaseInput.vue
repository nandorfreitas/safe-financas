<template>
  <div :class="['base-input', { 'base-input--error': error, 'base-input--disabled': disabled }]">
    <label v-if="label" :for="inputId" class="base-input__label">{{ label }}</label>
    <input
      :id="inputId"
      class="base-input__field"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :step="step"
      :min="min"
      :max="max"
      @input="$emit('update:modelValue', $event.target.value)"
      @blur="$emit('blur', $event)"
    />
    <span v-if="error" class="base-input__error">{{ error }}</span>
    <span v-if="hint && !error" class="base-input__hint">{{ hint }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  error: { type: String, default: '' },
  hint: { type: String, default: '' },
  step: { type: String, default: undefined },
  min: { type: String, default: undefined },
  max: { type: String, default: undefined }
})

defineEmits(['update:modelValue', 'blur'])

const inputId = computed(() => `input-${props.label?.toLowerCase().replace(/\s+/g, '-') || Math.random().toString(36).slice(2)}`)
</script>

<style scoped>
.base-input {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.base-input__label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
}

.base-input__field {
  height: 2.375rem;
  padding: 0 var(--space-3);
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: var(--radius-lg);
  color: var(--input-text);
  font-size: var(--text-sm);
  transition: border-color var(--duration-normal) var(--easing-default),
              box-shadow var(--duration-normal) var(--easing-default);
}

.base-input__field::placeholder {
  color: var(--input-placeholder);
}

.base-input__field:hover:not(:disabled) {
  border-color: var(--input-border-hover);
}

.base-input__field:focus {
  outline: none;
  border-color: var(--input-border-focus);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.12);
}

.base-input--error .base-input__field {
  border-color: var(--color-danger);
}

.base-input--error .base-input__field:focus {
  box-shadow: 0 0 0 3px rgba(244, 63, 94, 0.12);
}

.base-input--disabled .base-input__field {
  background: var(--input-bg-disabled);
  opacity: 0.5;
  cursor: not-allowed;
}

.base-input__error {
  font-size: var(--text-xs);
  color: var(--color-danger);
}

.base-input__hint {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}
</style>
