<script setup lang="ts">
import { computed } from "vue";
import { SwitchRoot, SwitchThumb } from "reka-ui";
import { uid } from "../utils";

const props = defineProps<{ modelValue?: boolean; disabled?: boolean }>();
const emit = defineEmits<{ (e: "update:modelValue", value: boolean): void }>();

const fieldId = uid("toggle");
const checked = computed(() => props.modelValue ?? false);
</script>

<template>
  <span class="oren-toggle" :class="{ 'oren-toggle--disabled': disabled }">
    <SwitchRoot
      :id="fieldId"
      class="oren-toggle__switch"
      :model-value="checked"
      :disabled="disabled"
      @update:model-value="emit('update:modelValue', $event)"
    >
      <SwitchThumb class="oren-toggle__thumb" />
    </SwitchRoot>
    <label v-if="$slots.default" :for="fieldId" class="oren-toggle__label"><slot /></label>
  </span>
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
  padding: 0;
  border: none;
  border-radius: var(--radius-pill);
  background: var(--gray-300);
  cursor: pointer;
  transition: background 0.2s;
}
.oren-toggle__switch[data-state="checked"] {
  background: var(--action-primary);
}
.oren-toggle__switch:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--focus-ring);
}
.oren-toggle__thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  height: 18px;
  width: 18px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.2s;
}
.oren-toggle__switch[data-state="checked"] .oren-toggle__thumb {
  transform: translateX(18px);
}
.oren-toggle__label {
  cursor: pointer;
}
.oren-toggle--disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.oren-toggle--disabled .oren-toggle__switch,
.oren-toggle--disabled .oren-toggle__label {
  cursor: not-allowed;
}
@media (prefers-reduced-motion: reduce) {
  .oren-toggle__switch,
  .oren-toggle__thumb {
    transition: none;
  }
}
</style>
