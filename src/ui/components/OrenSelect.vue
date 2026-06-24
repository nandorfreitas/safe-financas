<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, nextTick } from "vue";
import { uid } from "../utils";
import type { SelectOption } from "../types";

const props = withDefaults(
  defineProps<{
    modelValue?: string | number;
    options?: SelectOption[];
    label?: string;
    disabled?: boolean;
    id?: string;
  }>(),
  { options: () => [], disabled: false },
);

const emit = defineEmits<{ (e: "update:modelValue", value: string | number): void }>();

const fieldId = computed(() => props.id ?? uid("select"));
const open = ref(false);
const trigger = ref<HTMLElement | null>(null);
const root = ref<HTMLElement | null>(null);

const dropdownStyle = ref<{ top: string; left: string; width: string }>({
  top: "0px",
  left: "0px",
  width: "0px",
});

const selectedLabel = computed(() => {
  const found = props.options.find((o) => o.value === props.modelValue);
  return found ? found.label : "";
});

function select(opt: SelectOption) {
  emit("update:modelValue", opt.value);
  open.value = false;
}

function toggle() {
  if (props.disabled) return;
  open.value = !open.value;
  if (open.value) {
    nextTick(() => {
      if (!trigger.value) return;
      const rect = trigger.value.getBoundingClientRect();
      dropdownStyle.value = {
        top: `${rect.bottom + window.scrollY + 4}px`,
        left: `${rect.left + window.scrollX}px`,
        width: `${rect.width}px`,
      };
    });
  }
}

function onOutside(e: MouseEvent) {
  const target = e.target as Node;
  if (
    root.value && !root.value.contains(target) &&
    trigger.value && !trigger.value.contains(target)
  ) {
    open.value = false;
  }
}

onMounted(() => document.addEventListener("mousedown", onOutside));
onBeforeUnmount(() => document.removeEventListener("mousedown", onOutside));
</script>

<template>
  <div class="oren-field" ref="root">
    <label v-if="label" class="oren-field__label" :for="fieldId">{{ label }}</label>

    <div
      ref="trigger"
      :id="fieldId"
      class="oren-select"
      :class="{ 'oren-select--open': open, 'oren-select--disabled': disabled }"
      :tabindex="disabled ? -1 : 0"
      role="combobox"
      :aria-expanded="open"
      :aria-disabled="disabled"
      @click="toggle"
      @keydown.enter.prevent="toggle"
      @keydown.space.prevent="toggle"
      @keydown.escape="open = false"
    >
      <span class="oren-select__value">{{ selectedLabel }}</span>
      <svg class="oren-select__arrow" xmlns="http://www.w3.org/2000/svg" width="12" height="8" viewBox="0 0 12 8">
        <path fill="none" stroke="currentColor" stroke-width="1.6" d="M1 1.5 6 6.5 11 1.5"/>
      </svg>
    </div>

    <Teleport to="body">
      <ul
        v-if="open"
        class="oren-select__dropdown"
        role="listbox"
        :style="dropdownStyle"
      >
        <li
          v-for="opt in options"
          :key="opt.value"
          class="oren-select__option"
          :class="{ 'oren-select__option--selected': opt.value === modelValue }"
          role="option"
          :aria-selected="opt.value === modelValue"
          @mousedown.prevent="select(opt)"
        >
          {{ opt.label }}
        </li>
      </ul>
    </Teleport>
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

.oren-select {
  width: 100%;
  font-family: inherit;
  font-size: 15px;
  padding: 10px 13px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-control);
  background-color: var(--surface-default);
  color: var(--text-default);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  box-sizing: border-box;
  user-select: none;
}

.oren-select:focus {
  outline: none;
  border-color: var(--action-primary);
  box-shadow: 0 0 0 3px var(--focus-ring);
}

.oren-select--open {
  border-color: var(--action-primary);
  box-shadow: 0 0 0 3px var(--focus-ring);
}

.oren-select--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.oren-select__value {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.oren-select__arrow {
  flex-shrink: 0;
  color: var(--text-muted);
  transition: transform 0.15s ease;
}

.oren-select--open .oren-select__arrow {
  transform: rotate(180deg);
}
</style>

<style>
.oren-select__dropdown {
  position: absolute;
  background: var(--surface-default, #fff);
  border: 1px solid var(--border-default, #cdd5d1);
  border-radius: var(--radius-control, 8px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  list-style: none;
  margin: 0;
  padding: 4px 0;
  z-index: 9999;
  overflow-y: auto;
  max-height: 220px;
  font-family: var(--font-family, "Inter", system-ui, sans-serif);
}

.oren-select__option {
  padding: 10px 13px;
  font-size: 15px;
  color: var(--text-default, #092d29);
  cursor: pointer;
}

.oren-select__option:hover {
  background: var(--surface-subtle, #e8f3e8);
}

.oren-select__option--selected {
  font-weight: 500;
  color: var(--action-primary, #0e5351);
}
</style>
