<script setup lang="ts">
import { computed } from "vue";
import {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectIcon,
  SelectPortal,
  SelectContent,
  SelectViewport,
  SelectItem,
  SelectItemText,
  SelectItemIndicator,
} from "reka-ui";
import { uid } from "../utils";
import type { SelectOption } from "../types";

const props = withDefaults(
  defineProps<{
    modelValue?: string | number;
    options?: SelectOption[];
    label?: string;
    disabled?: boolean;
    id?: string;
    placeholder?: string;
  }>(),
  { options: () => [], disabled: false },
);

const emit = defineEmits<{ (e: "update:modelValue", value: string | number): void }>();

const fieldId = computed(() => props.id ?? uid("select"));

// A Reka (como o Radix) reserva value="" para "sem seleção", então mapeamos
// os valores das opções para chaves de texto (com um sentinela para "") e
// reconvertemos no emit — preservando a API pública (string | number).
const EMPTY_KEY = " empty";
function keyOf(v: string | number): string {
  return v === "" ? EMPTY_KEY : String(v);
}

const currentKey = computed(() => keyOf(props.modelValue ?? ""));

function onUpdate(key: string) {
  const opt = props.options.find((o) => keyOf(o.value) === key);
  emit("update:modelValue", opt ? opt.value : "");
}
</script>

<template>
  <div class="oren-field">
    <label v-if="label" class="oren-field__label" :for="fieldId">{{ label }}</label>

    <SelectRoot :model-value="currentKey" :disabled="disabled" @update:model-value="onUpdate">
      <SelectTrigger :id="fieldId" class="oren-select" :aria-label="label">
        <SelectValue class="oren-select__value" :placeholder="placeholder ?? ''" />
        <SelectIcon class="oren-select__arrow">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="8" viewBox="0 0 12 8">
            <path fill="none" stroke="currentColor" stroke-width="1.6" d="M1 1.5 6 6.5 11 1.5" />
          </svg>
        </SelectIcon>
      </SelectTrigger>

      <SelectPortal>
        <SelectContent class="oren-select__dropdown" position="popper" :side-offset="4">
          <SelectViewport>
            <SelectItem
              v-for="opt in options"
              :key="keyOf(opt.value)"
              class="oren-select__option"
              :value="keyOf(opt.value)"
            >
              <SelectItemText>{{ opt.label }}</SelectItemText>
              <SelectItemIndicator class="oren-select__check">✓</SelectItemIndicator>
            </SelectItem>
          </SelectViewport>
        </SelectContent>
      </SelectPortal>
    </SelectRoot>
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
  text-align: left;
  line-height: 1.3;
}

.oren-select:focus {
  outline: none;
  border-color: var(--action-primary);
  box-shadow: 0 0 0 3px var(--focus-ring);
}

.oren-select[data-state="open"] {
  border-color: var(--action-primary);
  box-shadow: 0 0 0 3px var(--focus-ring);
}

.oren-select[data-disabled] {
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
  display: inline-flex;
  flex-shrink: 0;
  color: var(--text-muted);
  transition: transform 0.15s ease;
}

.oren-select[data-state="open"] .oren-select__arrow {
  transform: rotate(180deg);
}
</style>

<style>
/* O conteúdo é teleportado para o body (fora do escopo) — estilos globais. */
.oren-select__dropdown {
  /* Pelo menos a largura do gatilho, mas cresce com o conteúdo. */
  min-width: var(--reka-select-trigger-width);
  width: max-content;
  max-width: min(420px, calc(100vw - 24px));
  background: var(--surface-default, #fff);
  border: 1px solid var(--border-default, #cdd5d1);
  border-radius: var(--radius-control, 8px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  padding: 4px 0;
  z-index: 9999;
  overflow-y: auto;
  max-height: 220px;
  font-family: var(--font-family, "Inter", system-ui, sans-serif);
}

.oren-select__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 13px;
  font-size: 15px;
  color: var(--text-default, #092d29);
  cursor: pointer;
  user-select: none;
  outline: none;
  white-space: nowrap;
}

.oren-select__option:hover,
.oren-select__option[data-highlighted] {
  background: var(--surface-subtle, #e8f3e8);
}

.oren-select__option[data-state="checked"] {
  font-weight: 500;
  color: var(--action-primary, #0e5351);
}

.oren-select__check {
  flex-shrink: 0;
  color: var(--action-primary, #0e5351);
}
</style>
