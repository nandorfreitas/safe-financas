<script setup lang="ts">
defineProps<{ modelValue?: boolean; disabled?: boolean }>();
defineEmits<{ (e: "update:modelValue", value: boolean): void }>();
</script>

<template>
  <label class="oren-toggle" :class="{ 'oren-toggle--disabled': disabled }">
    <span class="oren-toggle__switch">
      <input
        type="checkbox"
        :checked="modelValue"
        :disabled="disabled"
        @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
      />
      <span class="oren-toggle__slider" />
    </span>
    <span v-if="$slots.default" class="oren-toggle__label"><slot /></span>
  </label>
</template>

<style scoped>
.oren-toggle {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-family);
  font-size: 15px;
  color: var(--text-default);
  cursor: pointer;
}
.oren-toggle__switch {
  position: relative;
  display: inline-block;
  width: 42px;
  height: 24px;
  flex: none;
}
.oren-toggle__switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.oren-toggle__slider {
  position: absolute;
  inset: 0;
  background: var(--gray-300);
  border-radius: var(--radius-pill);
  transition: 0.2s;
  cursor: pointer;
}
.oren-toggle__slider::before {
  content: "";
  position: absolute;
  height: 18px;
  width: 18px;
  left: 3px;
  top: 3px;
  background: #fff;
  border-radius: 50%;
  transition: 0.2s;
}
.oren-toggle__switch input:checked + .oren-toggle__slider {
  background: var(--action-primary);
}
.oren-toggle__switch input:checked + .oren-toggle__slider::before {
  transform: translateX(18px);
}
.oren-toggle__switch input:focus-visible + .oren-toggle__slider {
  box-shadow: 0 0 0 3px var(--focus-ring);
}
.oren-toggle--disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
@media (prefers-reduced-motion: reduce) {
  .oren-toggle__slider,
  .oren-toggle__slider::before {
    transition: none;
  }
}
</style>
