<script setup lang="ts">
import { computed } from "vue";
import type { Pillar } from "../types";

const props = withDefaults(
  defineProps<{
    /** Rótulo curto (UPPERCASE no conteúdo). */
    label: string;
    /** Valor principal, já formatado (ex.: "USD 654.5B"). */
    value: string;
    /** Variação percentual; positivo = alta, negativo = queda. */
    delta?: number;
    /** Texto ao lado da variação (ex.: "vs. mês anterior"). */
    deltaLabel?: string;
    /** Linha de fonte do dado, em itálico discreto. */
    source?: string;
    /** Acento de pilar para a marca superior do card. */
    tone?: Pillar | "default";
  }>(),
  { tone: "default" },
);

const toneColor = computed(
  () =>
    ({
      payments: "var(--oren-payments)",
      capital: "var(--oren-capital)",
      governance: "var(--oren-governance)",
      default: "var(--action-primary)",
    })[props.tone],
);

const deltaUp = computed(() => (props.delta ?? 0) >= 0);
const deltaText = computed(() => {
  if (props.delta == null) return "";
  const sign = props.delta > 0 ? "+" : "";
  return `${sign}${props.delta}%`;
});
</script>

<template>
  <div class="oren-stat">
    <span class="oren-stat__bar" :style="{ background: toneColor }" />
    <div class="oren-stat__label">{{ label }}</div>
    <div class="oren-stat__value">{{ value }}</div>
    <div v-if="delta != null || deltaLabel" class="oren-stat__delta">
      <span
        v-if="delta != null"
        class="oren-stat__chip"
        :class="deltaUp ? 'is-up' : 'is-down'"
      >
        <svg width="9" height="9" viewBox="0 0 9 9" aria-hidden="true">
          <path v-if="deltaUp" d="M4.5 1.5 8 6H1z" fill="currentColor" />
          <path v-else d="M4.5 7.5 1 3h7z" fill="currentColor" />
        </svg>
        {{ deltaText }}
      </span>
      <span v-if="deltaLabel" class="oren-stat__deltalabel">{{ deltaLabel }}</span>
    </div>
    <div v-if="source" class="oren-stat__source">{{ source }}</div>
  </div>
</template>

<style scoped>
.oren-stat {
  position: relative;
  font-family: var(--font-family);
  background: var(--surface-default);
  border: 1px solid var(--border-default);
  border-radius: var(--radius);
  padding: 18px 18px 16px;
  overflow: hidden;
}
.oren-stat__bar {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
}
.oren-stat__label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
}
.oren-stat__value {
  font-size: 30px;
  font-weight: 400;
  letter-spacing: -0.02em;
  color: var(--text-default);
  margin-top: 10px;
  font-variant-numeric: tabular-nums;
}
.oren-stat__delta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
}
.oren-stat__chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
}
.oren-stat__chip.is-up {
  background: #e3f6ec;
  color: #0f7a40;
}
.oren-stat__chip.is-down {
  background: #fdeceb;
  color: #b42318;
}
.oren-stat__deltalabel {
  font-size: 12px;
  color: var(--text-muted);
}
.oren-stat__source {
  font-size: 11px;
  font-style: italic;
  color: var(--text-muted);
  margin-top: 12px;
  line-height: 1.4;
}
[data-theme="dark"] .oren-stat__chip.is-up {
  background: rgba(98, 204, 109, 0.18);
  color: #8fe39a;
}
[data-theme="dark"] .oren-stat__chip.is-down {
  background: rgba(217, 45, 32, 0.2);
  color: #ffb4ab;
}
</style>
