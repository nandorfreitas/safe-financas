<script setup lang="ts">
defineProps<{ modelValue?: boolean; disabled?: boolean }>();
defineEmits<{ (e: "update:modelValue", value: boolean): void }>();
</script>

<template>
  <label class="oren-check" :class="{ 'oren-check--disabled': disabled }">
    <input
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    />
    <span><slot /></span>
  </label>
</template>

<style scoped>
.oren-check {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  font-family: var(--font-family);
  font-size: 15px;
  color: var(--text-default);
  cursor: pointer;
}
.oren-check input {
  width: 18px;
  height: 18px;
  accent-color: var(--action-primary);
  cursor: pointer;
}
.oren-check--disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
</style>
