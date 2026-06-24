<script setup lang="ts">
defineProps<{
  modelValue?: string | number;
  value: string | number;
  name: string;
  disabled?: boolean;
}>();
defineEmits<{ (e: "update:modelValue", value: string | number): void }>();
</script>

<template>
  <label class="oren-radio" :class="{ 'oren-radio--disabled': disabled }">
    <input
      type="radio"
      :name="name"
      :value="value"
      :checked="modelValue === value"
      :disabled="disabled"
      @change="$emit('update:modelValue', value)"
    />
    <span><slot /></span>
  </label>
</template>

<style scoped>
.oren-radio {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  font-family: var(--font-family);
  font-size: 15px;
  color: var(--text-default);
  cursor: pointer;
}
.oren-radio input {
  width: 18px;
  height: 18px;
  accent-color: var(--action-primary);
  cursor: pointer;
}
.oren-radio--disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
</style>
