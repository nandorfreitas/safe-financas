<script setup lang="ts">
import { computed } from "vue";
import { uid } from "../utils";

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    label?: string;
    placeholder?: string;
    rows?: number;
    disabled?: boolean;
    id?: string;
  }>(),
  { modelValue: "", rows: 4, disabled: false },
);

defineEmits<{ (e: "update:modelValue", value: string): void }>();

const fieldId = computed(() => props.id ?? uid("textarea"));
</script>

<template>
  <div class="oren-field">
    <label v-if="label" class="oren-field__label" :for="fieldId">{{ label }}</label>
    <textarea
      :id="fieldId"
      class="oren-textarea"
      :rows="rows"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
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
.oren-textarea {
  width: 100%;
  box-sizing: border-box;
  font-family: inherit;
  font-size: 15px;
  padding: 10px 13px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-control);
  background: var(--surface-default);
  color: var(--text-default);
  resize: vertical;
  min-height: 84px;
}
.oren-textarea::placeholder {
  color: var(--text-muted);
}
.oren-textarea:focus {
  outline: none;
  border-color: var(--action-primary);
  box-shadow: 0 0 0 3px var(--focus-ring);
}
</style>
