<script setup lang="ts">
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export interface SidebarItem {
  key: string;
  label: string;
  icon: IconDefinition;
}

export interface SidebarGroup {
  title: string;
  items: SidebarItem[];
}

const props = withDefaults(
  defineProps<{
    /** Aberta (true) ou recolhida (false). v-model. */
    modelValue?: boolean;
    /** Chave do item ativo. v-model:active. */
    active?: string;
    /** Grupos de navegação. */
    groups?: SidebarGroup[];
    /** Marca exibida no topo (slot `brand` tem prioridade). */
    title?: string;
    subtitle?: string;
    /** Ícone do botão Sair (regular). */
    logoutIcon?: IconDefinition;
  }>(),
  { modelValue: true, groups: () => [] },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "update:active", value: string): void;
  (e: "logout"): void;
}>();

function toggle() {
  emit("update:modelValue", !props.modelValue);
}
</script>

<template>
  <div class="osb-wrap" :class="{ 'osb-wrap--closed': !modelValue }">
    <aside class="osb" aria-label="Navegação principal">
      <div class="osb__head">
        <span class="osb__logo"><slot name="brand-mark" /></span>
        <span class="osb__brand">
          <b>{{ title ?? "Oren" }}</b>
          <span v-if="subtitle">{{ subtitle }}</span>
        </span>
      </div>
      <div class="osb__rule" />

      <nav class="osb__nav">
        <template v-for="group in groups" :key="group.title">
          <div class="osb__group">{{ group.title }}</div>
          <button
            v-for="item in group.items"
            :key="item.key"
            class="osb__item"
            :class="{ 'osb__item--active': active === item.key }"
            :title="item.label"
            @click="emit('update:active', item.key)"
          >
            <span class="osb__ic">
              <FontAwesomeIcon :icon="item.icon" :style="{ fontSize: '16px' }" />
            </span>
            <span class="osb__label">{{ item.label }}</span>
          </button>
        </template>
      </nav>

      <div class="osb__foot">
        <button class="osb__item osb__logout" title="Sair" @click="emit('logout')">
          <span class="osb__ic">
            <FontAwesomeIcon
              v-if="logoutIcon"
              :icon="logoutIcon"
              :style="{ fontSize: '16px' }"
            />
            <svg v-else width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M6 14H3.5A1.5 1.5 0 0 1 2 12.5v-9A1.5 1.5 0 0 1 3.5 2H6"
                stroke="currentColor"
                stroke-width="1.4"
                stroke-linecap="round"
              />
              <path
                d="M10.5 11 13.5 8l-3-3M13.5 8H6"
                stroke="currentColor"
                stroke-width="1.4"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>
          <span class="osb__label">Sair</span>
        </button>
      </div>
    </aside>

    <button
      class="osb__toggle"
      :class="{ 'osb__toggle--closed': !modelValue }"
      :aria-label="modelValue ? 'Recolher menu' : 'Expandir menu'"
      :aria-expanded="modelValue"
      @click="toggle"
    >
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <path
          d="M8 2.5 4 6.5l4 4"
          stroke="currentColor"
          stroke-width="1.7"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.osb-wrap {
  position: relative;
  flex: none;
  width: 264px;
  min-width: 264px;
  max-width: 264px;
  transition: width 0.26s cubic-bezier(0.4, 0, 0.2, 1),
    min-width 0.26s cubic-bezier(0.4, 0, 0.2, 1),
    max-width 0.26s cubic-bezier(0.4, 0, 0.2, 1);
}
.osb-wrap--closed {
  width: 72px;
  min-width: 72px;
  max-width: 72px;
}
.osb {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--green-darkest);
  color: var(--flash-white);
  font-family: var(--font-family);
  overflow: hidden;
}
.osb__head {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 16px 14px;
  height: 60px;
  flex: none;
}
.osb__logo {
  width: 38px;
  height: 38px;
  flex: none;
  border-radius: 10px;
  background: var(--green-itaville);
  display: flex;
  align-items: center;
  justify-content: center;
}
.osb__brand {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
  white-space: nowrap;
  overflow: hidden;
  transition: opacity 0.18s;
}
.osb__brand b {
  font-size: 14px;
  font-weight: 600;
  color: var(--white);
}
.osb__brand span {
  font-size: 9.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--green-soft);
  margin-top: 3px;
}
.osb-wrap--closed .osb__brand {
  opacity: 0;
  pointer-events: none;
}
.osb__rule {
  height: 1px;
  background: rgba(232, 243, 232, 0.1);
  margin: 0 14px;
  flex: none;
}
.osb__nav {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  scrollbar-width: thin;
  scrollbar-color: rgba(232, 243, 232, 0.15) transparent;
}
.osb__nav::-webkit-scrollbar {
  width: 4px;
}
.osb__nav::-webkit-scrollbar-track {
  background: transparent;
}
.osb__nav::-webkit-scrollbar-thumb {
  background: rgba(232, 243, 232, 0.15);
  border-radius: 4px;
}
.osb__nav::-webkit-scrollbar-thumb:hover {
  background: rgba(232, 243, 232, 0.28);
}
.osb__group {
  flex: none;
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  color: var(--gray-500);
  padding: 12px 12px 6px;
  white-space: nowrap;
  overflow: hidden;
  transition: opacity 0.18s;
}
.osb-wrap--closed .osb__group {
  opacity: 0;
  height: 12px;
  padding-top: 8px;
  padding-bottom: 0;
}
.osb__item {
  flex: none;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 9px 11px;
  border: none;
  border-radius: 9px;
  background: none;
  color: rgba(232, 243, 232, 0.78);
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  white-space: nowrap;
  transition: background 0.14s, color 0.14s;
}
.osb__item:hover {
  background: rgba(232, 243, 232, 0.08);
  color: var(--flash-white);
}
.osb__item--active {
  background: var(--green-itaville);
  color: var(--white);
}
.osb__item--active .osb__ic {
  background: var(--green-light);
  color: var(--green-darkest);
}
.osb__ic {
  width: 26px;
  height: 26px;
  flex: none;
  border-radius: 7px;
  background: rgba(232, 243, 232, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.14s, color 0.14s;
}
.osb__label {
  overflow: hidden;
  transition: opacity 0.18s;
}
.osb-wrap--closed .osb__label {
  opacity: 0;
}
.osb__foot {
  flex: none;
  padding: 11px;
  border-top: 1px solid rgba(232, 243, 232, 0.1);
}
.osb__logout {
  color: rgba(232, 243, 232, 0.7);
}
.osb__logout:hover {
  background: rgba(217, 45, 32, 0.16);
  color: #ffb4ab;
}
.osb__logout:hover .osb__ic {
  background: rgba(217, 45, 32, 0.22);
  color: #ffb4ab;
}
.osb__toggle {
  position: absolute;
  top: 24px;
  right: -12px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid rgba(232, 243, 232, 0.2);
  background: var(--green-darkest);
  color: var(--flash-white);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(9, 45, 41, 0.15);
  transition: background 0.14s, color 0.14s;
  z-index: 3;
}
.osb__toggle:hover {
  background: var(--green-light);
  color: var(--green-darkest);
  border-color: var(--green-light);
}
.osb__toggle svg {
  transition: transform 0.26s cubic-bezier(0.4, 0, 0.2, 1);
}
.osb__toggle--closed svg {
  transform: rotate(180deg);
}
@media (prefers-reduced-motion: reduce) {
  .osb-wrap,
  .osb__toggle svg,
  .osb__brand,
  .osb__label,
  .osb__group {
    transition: none;
  }
}
</style>
