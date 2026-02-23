<template>
  <div :class="['base-textarea', { 'base-textarea--error': error, 'base-textarea--disabled': disabled }]">
    <label v-if="label" :for="textareaId" class="base-textarea__label">{{ label }}</label>
    <textarea
      :id="textareaId"
      class="base-textarea__field"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :rows="rows"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <span v-if="error" class="base-textarea__error">{{ error }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  error: { type: String, default: '' },
  rows: { type: Number, default: 3 }
})

defineEmits(['update:modelValue'])

const textareaId = computed(() => `textarea-${props.label?.toLowerCase().replace(/\s+/g, '-') || Math.random().toString(36).slice(2)}`)
</script>

<style scoped>
.base-textarea {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.base-textarea__label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
}

.base-textarea__field {
  padding: var(--space-3);
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: var(--radius-lg);
  color: var(--input-text);
  font-size: var(--text-sm);
  resize: vertical;
  transition: border-color var(--duration-normal) var(--easing-default);
}

.base-textarea__field::placeholder {
  color: var(--input-placeholder);
}

.base-textarea__field:hover:not(:disabled) {
  border-color: var(--input-border-hover);
}

.base-textarea__field:focus {
  outline: none;
  border-color: var(--input-border-focus);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.12);
}

.base-textarea--error .base-textarea__field {
  border-color: var(--color-danger);
}

.base-textarea--disabled .base-textarea__field {
  background: var(--input-bg-disabled);
  opacity: 0.5;
  cursor: not-allowed;
}

.base-textarea__error {
  font-size: var(--text-xs);
  color: var(--color-danger);
}
</style>
