<template>
  <div class="pie-chart">
    <div v-if="!chartData.length" class="pie-chart__empty">
      <p>Nenhum gasto registrado neste mês</p>
    </div>
    <template v-else>
      <div class="pie-chart__container">
        <svg viewBox="0 0 200 200" class="pie-chart__svg">
          <circle
            v-for="(segment, i) in segments"
            :key="i"
            cx="100"
            cy="100"
            r="80"
            fill="none"
            :stroke="segment.color"
            stroke-width="36"
            :stroke-dasharray="segment.dashArray"
            :stroke-dashoffset="segment.dashOffset"
            :opacity="hoveredIndex === null || hoveredIndex === i ? 1 : 0.35"
            class="pie-chart__segment"
            @mouseenter="hoveredIndex = i"
            @mouseleave="hoveredIndex = null"
          />
          <!-- Center text -->
          <text x="100" y="94" text-anchor="middle" class="pie-chart__center-label">Total</text>
          <text x="100" y="112" text-anchor="middle" class="pie-chart__center-value">{{ formatCurrency(total) }}</text>
        </svg>
      </div>
      <div class="pie-chart__legend">
        <div
          v-for="(item, i) in chartData"
          :key="i"
          class="pie-chart__legend-item"
          :class="{ 'pie-chart__legend-item--dimmed': hoveredIndex !== null && hoveredIndex !== i }"
          @mouseenter="hoveredIndex = i"
          @mouseleave="hoveredIndex = null"
        >
          <span class="pie-chart__legend-dot" :style="{ background: colors[i % colors.length] }"></span>
          <span class="pie-chart__legend-name">{{ item.name }}</span>
          <span class="pie-chart__legend-value">{{ formatCurrency(item.spent) }}</span>
          <span class="pie-chart__legend-pct">{{ item.pct }}%</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  expenses: { type: Array, default: () => [] }
})

const hoveredIndex = ref(null)

const colors = [
  '#10b981', '#f43f5e', '#0ea5e9', '#f59e0b', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
  '#06b6d4', '#ef4444'
]

const total = computed(() => props.expenses.reduce((sum, c) => sum + (c.total || 0), 0))

const chartData = computed(() =>
  props.expenses
    .filter(c => (c.total || 0) > 0)
    .sort((a, b) => b.total - a.total)
    .map((c, i) => ({
      ...c,
      name: c.category_name,
      spent: c.total,
      color: colors[i % colors.length],
      pct: total.value > 0 ? Math.round((c.total / total.value) * 100) : 0
    }))
)

// SVG donut segments using stroke-dasharray/dashoffset
const circumference = 2 * Math.PI * 80 // r=80

const segments = computed(() => {
  let offset = 0
  return chartData.value.map((item, i) => {
    const fraction = total.value > 0 ? item.spent / total.value : 0
    const length = fraction * circumference
    const gap = circumference - length
    const dashArray = `${length} ${gap}`
    const dashOffset = -offset + circumference * 0.25
    offset += length
    return {
      color: colors[i % colors.length],
      dashArray,
      dashOffset
    }
  })
})

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}
</script>

<style scoped>
.pie-chart {
  display: flex;
  align-items: flex-start;
  gap: var(--space-6);
}

@media (max-width: 768px) {
  .pie-chart {
    flex-direction: column;
    align-items: center;
  }
}

.pie-chart__empty {
  width: 100%;
  text-align: center;
  padding: var(--space-8) 0;
}

.pie-chart__empty p {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

.pie-chart__container {
  flex-shrink: 0;
  width: 200px;
  height: 200px;
}

.pie-chart__svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.pie-chart__segment {
  transition: opacity 0.2s ease;
  cursor: pointer;
}

.pie-chart__center-label {
  font-size: 11px;
  fill: var(--text-tertiary);
  transform: rotate(90deg);
  transform-origin: 100px 100px;
}

.pie-chart__center-value {
  font-size: 13px;
  font-weight: 700;
  fill: var(--text-primary);
  transform: rotate(90deg);
  transform-origin: 100px 100px;
}

.pie-chart__legend {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  flex: 1;
  min-width: 0;
}

.pie-chart__legend-item {
  display: grid;
  grid-template-columns: 10px 1fr auto auto;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  transition: all 0.15s ease;
  cursor: default;
}

.pie-chart__legend-item:hover {
  background: var(--bg-muted);
}

.pie-chart__legend-item--dimmed {
  opacity: 0.4;
}

.pie-chart__legend-dot {
  width: 10px;
  height: 10px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

.pie-chart__legend-name {
  font-size: var(--text-sm);
  color: var(--text-primary);
  font-weight: var(--font-medium);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pie-chart__legend-value {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  text-align: right;
}

.pie-chart__legend-pct {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  font-weight: var(--font-medium);
  min-width: 32px;
  text-align: right;
}
</style>
