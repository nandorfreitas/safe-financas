<script setup lang="ts">
import { computed, useSlots } from "vue";

interface Series {
  /** Nome da série (legenda). */
  name: string;
  /** Valores. */
  data: number[];
  /** Cor da linha/barra (CSS). */
  color?: string;
}

const props = withDefaults(
  defineProps<{
    title?: string;
    /** Rótulos do eixo X. */
    labels?: string[];
    /** Uma ou mais séries. */
    series?: Series[];
    /** Tipo de gráfico. */
    type?: "line" | "bar";
    /** Altura da área de plotagem em px. */
    height?: number;
  }>(),
  { type: "line", height: 200, labels: () => [], series: () => [] },
);

const slots = useSlots();

const W = 520;
const PAD = { t: 12, r: 12, b: 26, l: 12 };

const maxV = computed(() => {
  const all = props.series.flatMap((s) => s.data);
  return all.length ? Math.max(...all) : 1;
});

const palette = ["var(--action-primary)", "var(--oren-capital)", "var(--oren-governance)"];

function color(s: Series, i: number): string {
  return s.color ?? palette[i % palette.length];
}

const plotW = computed(() => W - PAD.l - PAD.r);
const plotH = computed(() => props.height - PAD.t - PAD.b);

function x(i: number, n: number): number {
  if (n <= 1) return PAD.l + plotW.value / 2;
  return PAD.l + (plotW.value * i) / (n - 1);
}
function y(v: number): number {
  return PAD.t + plotH.value * (1 - v / maxV.value);
}

const linePaths = computed(() =>
  props.series.map((s, si) => ({
    color: color(s, si),
    d: s.data
      .map((v, i) => `${i === 0 ? "M" : "L"}${x(i, s.data.length).toFixed(1)},${y(v).toFixed(1)}`)
      .join(" "),
    area:
      `M${x(0, s.data.length).toFixed(1)},${y(s.data[0]).toFixed(1)} ` +
      s.data
        .map((v, i) => `L${x(i, s.data.length).toFixed(1)},${y(v).toFixed(1)}`)
        .join(" ") +
      ` L${x(s.data.length - 1, s.data.length).toFixed(1)},${(PAD.t + plotH.value).toFixed(1)}` +
      ` L${x(0, s.data.length).toFixed(1)},${(PAD.t + plotH.value).toFixed(1)} Z`,
  })),
);

const bars = computed(() => {
  const groups = props.labels.length || (props.series[0]?.data.length ?? 0);
  const groupW = plotW.value / Math.max(groups, 1);
  const n = props.series.length || 1;
  const barW = (groupW * 0.62) / n;
  const out: { x: number; y: number; h: number; color: string }[] = [];
  props.series.forEach((s, si) => {
    s.data.forEach((v, i) => {
      const gx = PAD.l + groupW * i + groupW * 0.19 + si * barW;
      out.push({ x: gx, y: y(v), h: PAD.t + plotH.value - y(v), color: color(s, si) });
    });
  });
  return { bars: out, barW };
});

const gridLines = computed(() => [0, 0.25, 0.5, 0.75, 1].map((f) => PAD.t + plotH.value * f));
</script>

<template>
  <div class="oren-chart">
    <div v-if="title || slots.actions || series.length" class="oren-chart__head">
      <h3 v-if="title" class="oren-chart__title">{{ title }}</h3>
      <div class="oren-chart__head-right">
        <div v-if="series.length > 1 || (series[0] && series[0].name)" class="oren-chart__legend">
          <span v-for="(s, i) in series" :key="s.name" class="oren-chart__leg">
            <span class="oren-chart__dot" :style="{ background: color(s, i) }" />
            {{ s.name }}
          </span>
        </div>
        <slot name="actions" />
      </div>
    </div>

    <svg
      class="oren-chart__svg"
      :viewBox="`0 0 ${W} ${height}`"
      :style="{ height: height + 'px' }"
      role="img"
      :aria-label="title || 'Gráfico'"
      preserveAspectRatio="none"
    >
      <line
        v-for="(gy, i) in gridLines"
        :key="i"
        :x1="PAD.l"
        :x2="W - PAD.r"
        :y1="gy"
        :y2="gy"
        class="oren-chart__grid"
      />
      <template v-if="type === 'line'">
        <path
          v-for="(p, i) in linePaths"
          :key="'a' + i"
          :d="p.area"
          :fill="p.color"
          opacity="0.08"
        />
        <path
          v-for="(p, i) in linePaths"
          :key="'l' + i"
          :d="p.d"
          fill="none"
          :stroke="p.color"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </template>
      <template v-else>
        <rect
          v-for="(b, i) in bars.bars"
          :key="i"
          :x="b.x"
          :y="b.y"
          :width="bars.barW"
          :height="Math.max(b.h, 0)"
          :fill="b.color"
          rx="2"
        />
      </template>
      <text
        v-for="(lab, i) in labels"
        :key="'x' + i"
        :x="x(i, labels.length)"
        :y="height - 8"
        class="oren-chart__axis"
        text-anchor="middle"
      >
        {{ lab }}
      </text>
    </svg>
  </div>
</template>

<style scoped>
.oren-chart {
  font-family: var(--font-family);
  background: var(--surface-default);
  border: 1px solid var(--border-default);
  border-radius: var(--radius);
  padding: 18px;
}
.oren-chart__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 8px;
}
.oren-chart__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-default);
  margin: 0;
}
.oren-chart__head-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.oren-chart__legend {
  display: flex;
  gap: 14px;
}
.oren-chart__leg {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-muted);
}
.oren-chart__dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}
.oren-chart__svg {
  width: 100%;
  display: block;
}
.oren-chart__grid {
  stroke: var(--border-default);
  stroke-width: 1;
}
.oren-chart__axis {
  fill: var(--text-muted);
  font-size: 10px;
  font-family: var(--font-family);
}
</style>
