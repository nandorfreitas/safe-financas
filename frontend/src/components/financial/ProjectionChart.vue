<template>
  <div class="projection-chart">
    <div v-if="!hasData" class="projection-chart__empty">
      <p>Sem dados de projeção</p>
    </div>
    <template v-else>
      <div class="projection-chart__legend">
        <span class="projection-chart__legend-item">
          <span class="projection-chart__dot projection-chart__dot--success"></span> Receitas
        </span>
        <span class="projection-chart__legend-item">
          <span class="projection-chart__dot projection-chart__dot--danger"></span> Despesas
        </span>
        <span class="projection-chart__legend-item">
          <span class="projection-chart__dot projection-chart__dot--primary"></span> Patrimônio
        </span>
      </div>

      <svg :viewBox="`0 0 ${width} ${height}`" class="projection-chart__svg" @mouseleave="activeIndex = -1">
        <!-- Grid lines -->
        <line v-for="i in 5" :key="'grid-' + i"
          :x1="padding.left" :x2="width - padding.right"
          :y1="padding.top + ((i - 1) / 4) * chartH"
          :y2="padding.top + ((i - 1) / 4) * chartH"
          class="projection-chart__grid"
        />

        <!-- Y-axis labels -->
        <text v-for="i in 5" :key="'ylabel-' + i"
          :x="padding.left - 8"
          :y="padding.top + ((i - 1) / 4) * chartH + 4"
          class="projection-chart__axis-label" text-anchor="end"
        >{{ formatCompact(maxVal - ((i - 1) / 4) * maxVal) }}</text>

        <!-- Lines -->
        <polyline :points="receitaPoints" class="projection-chart__line projection-chart__line--success" />
        <polyline :points="despesaPoints" class="projection-chart__line projection-chart__line--danger" />
        <polyline :points="patrimonioPoints" class="projection-chart__line projection-chart__line--primary" />

        <!-- Hover areas -->
        <rect v-for="(p, i) in projections" :key="'hover-' + i"
          :x="xPos(i) - stepW / 2" :y="padding.top" :width="stepW" :height="chartH"
          fill="transparent" @mouseenter="activeIndex = i"
        />

        <!-- Active dots -->
        <template v-if="activeIndex >= 0">
          <circle :cx="xPos(activeIndex)" :cy="yPos(projections[activeIndex].receitas)" r="5" class="projection-chart__dot-svg projection-chart__dot-svg--success" />
          <circle :cx="xPos(activeIndex)" :cy="yPos(projections[activeIndex].despesas)" r="5" class="projection-chart__dot-svg projection-chart__dot-svg--danger" />
          <circle :cx="xPos(activeIndex)" :cy="yPos(projections[activeIndex].patrimonio_projetado)" r="5" class="projection-chart__dot-svg projection-chart__dot-svg--primary" />
          <line :x1="xPos(activeIndex)" :x2="xPos(activeIndex)" :y1="padding.top" :y2="padding.top + chartH" class="projection-chart__hover-line"/>
        </template>

        <!-- X-axis labels -->
        <text v-for="(p, i) in projections" :key="'xlabel-' + i"
          :x="xPos(i)" :y="height - 4"
          class="projection-chart__axis-label" text-anchor="middle"
        >{{ formatMonth(p.competence) }}</text>
      </svg>

      <!-- Tooltip -->
      <div v-if="activeIndex >= 0" class="projection-chart__tooltip">
        <strong>{{ projections[activeIndex].competence }}</strong>
        <span class="tt-row"><span class="projection-chart__dot projection-chart__dot--success"></span> {{ formatCurrency(projections[activeIndex].receitas) }}</span>
        <span class="tt-row"><span class="projection-chart__dot projection-chart__dot--danger"></span> {{ formatCurrency(projections[activeIndex].despesas) }}</span>
        <span class="tt-row"><span class="projection-chart__dot projection-chart__dot--primary"></span> {{ formatCurrency(projections[activeIndex].patrimonio_projetado) }}</span>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  projections: { type: Array, default: () => [] }
})

const activeIndex = ref(-1)

const width = 720
const height = 300
const padding = { top: 20, right: 20, bottom: 30, left: 70 }
const chartH = height - padding.top - padding.bottom

const hasData = computed(() => props.projections.length > 0)

const allValues = computed(() => {
  const vals = []
  props.projections.forEach(p => {
    vals.push(p.receitas, p.despesas, p.patrimonio_projetado)
  })
  return vals
})

const maxVal = computed(() => {
  const max = Math.max(...allValues.value, 0)
  return max || 1
})

const stepW = computed(() => {
  const n = props.projections.length
  return n > 1 ? (width - padding.left - padding.right) / (n - 1) : 0
})

function xPos(i) {
  return padding.left + i * stepW.value
}

function yPos(val) {
  return padding.top + chartH - (val / maxVal.value) * chartH
}

const receitaPoints = computed(() =>
  props.projections.map((p, i) => `${xPos(i)},${yPos(p.receitas)}`).join(' ')
)

const despesaPoints = computed(() =>
  props.projections.map((p, i) => `${xPos(i)},${yPos(p.despesas)}`).join(' ')
)

const patrimonioPoints = computed(() =>
  props.projections.map((p, i) => `${xPos(i)},${yPos(p.patrimonio_projetado)}`).join(' ')
)

function formatMonth(comp) {
  const [, m] = comp.split('-')
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return months[parseInt(m) - 1]
}

function formatCompact(val) {
  if (val >= 1000) return `${(val / 1000).toFixed(0)}k`
  return val.toFixed(0)
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}
</script>

<style scoped>
.projection-chart {
  position: relative;
  padding: var(--space-2) 0;
}

.projection-chart__empty {
  text-align: center;
  padding: var(--space-8) 0;
  color: var(--text-tertiary);
  font-size: var(--text-sm);
}

.projection-chart__legend {
  display: flex;
  gap: var(--space-5);
  justify-content: center;
  margin-bottom: var(--space-4);
}

.projection-chart__legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-xs);
  color: var(--text-secondary);
  font-weight: var(--font-medium);
}

.projection-chart__dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  display: inline-block;
}

.projection-chart__dot--success { background: var(--color-success); }
.projection-chart__dot--danger { background: var(--color-danger); }
.projection-chart__dot--primary { background: var(--btn-primary-bg); }

.projection-chart__svg {
  width: 100%;
  height: auto;
}

.projection-chart__grid {
  stroke: var(--border-subtle);
  stroke-width: 1;
  stroke-dasharray: 4 4;
}

.projection-chart__axis-label {
  fill: var(--text-tertiary);
  font-size: 10px;
}

.projection-chart__line {
  fill: none;
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.projection-chart__line--success { stroke: var(--color-success); }
.projection-chart__line--danger { stroke: var(--color-danger); }
.projection-chart__line--primary { stroke: var(--btn-primary-bg); }

.projection-chart__dot-svg--success { fill: var(--color-success); }
.projection-chart__dot-svg--danger { fill: var(--color-danger); }
.projection-chart__dot-svg--primary { fill: var(--btn-primary-bg); }

.projection-chart__hover-line {
  stroke: var(--border-default);
  stroke-width: 1;
  stroke-dasharray: 4 4;
}

.projection-chart__tooltip {
  position: absolute;
  top: var(--space-2);
  right: var(--space-4);
  background: var(--modal-bg);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: var(--space-3);
  font-size: var(--text-xs);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  box-shadow: var(--shadow-md);
  z-index: 10;
}

.tt-row {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--text-primary);
}
</style>
