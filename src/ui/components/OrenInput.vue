<script setup lang="ts">
import { computed } from "vue";
import { uid } from "../utils";

const props = withDefaults(
  defineProps<{
    modelValue?: string | number;
    type?: string;
    label?: string;
    placeholder?: string;
    hint?: string;
    error?: string;
    disabled?: boolean;
    id?: string;
  }>(),
  { modelValue: "", type: "text", disabled: false },
);

defineEmits<{ (e: "update:modelValue", value: string | number): void }>();

const fieldId = computed(() => props.id ?? uid("input"));
</script>

<template>
  <div class="oren-field">
    <label v-if="label" class="oren-field__label" :for="fieldId">{{ label }}</label>
    <input
      :id="fieldId"
      class="oren-input"
      :class="{ 'oren-input--error': !!error }"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :aria-invalid="!!error || undefined"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <p v-if="error" class="oren-hint oren-hint--err">{{ error }}</p>
    <p v-else-if="hint" class="oren-hint">{{ hint }}</p>
  </div>
</template>

<style scoped>
.oren-field {
  font-family: var(--font-family);
}
.oren-field__label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-default);
}
.oren-input {
  width: 100%;
  box-sizing: border-box;
  font-family: inherit;
  font-size: 15px;
  padding: 10px 13px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-control);
  background: var(--surface-default);
  color: var(--text-default);
}
.oren-input::placeholder {
  color: var(--text-muted);
}
.oren-input:focus {
  outline: none;
  border-color: var(--action-primary);
  box-shadow: 0 0 0 3px var(--focus-ring);
}
.oren-input:disabled {
  background: var(--gray-100);
  cursor: not-allowed;
}
.oren-input--error {
  border-color: var(--feedback-error);
}
.oren-input--error:focus {
  box-shadow: 0 0 0 3px rgba(217, 45, 32, 0.25);
}
.oren-hint {
  font-size: 12px;
  color: var(--text-muted);
  margin: 5px 0 0;
}
.oren-hint--err {
  color: var(--feedback-error);
}
</style>
