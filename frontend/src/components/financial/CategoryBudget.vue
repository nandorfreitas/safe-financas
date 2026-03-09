<template>
  <div class="budget">
    <div v-if="!mainCategories.length" class="budget__empty">
      <p>Nenhuma categoria com orçamento definido</p>
      <span>Defina orçamentos nas suas categorias para acompanhar aqui</span>
    </div>
    <div v-else class="budget__list">
      <div v-for="cat in mainCategories" :key="cat.id" class="budget__item">
        <div class="budget__header">
          <div class="brand-cell">
            <span class="brand-dot" :style="{ backgroundColor: getBrandDetails(cat.name, 'tag').color }"></span>
            <span class="budget__name">{{ cat.name }}</span>
          </div>
          <span class="budget__status" :class="statusClass(cat)">
            {{ cat.percentage !== null ? cat.percentage + '%' : '—' }}
          </span>
        </div>

        <div class="budget__chart">
          <!-- Budget bar (projected) -->
          <div class="budget__bar-row">
            <span class="budget__bar-label">Orçamento</span>
            <div class="budget__bar-track">
              <div
                class="budget__bar-fill budget__bar-fill--budget"
                :style="{ width: budgetBarWidth(cat) + '%' }"
              ></div>
            </div>
            <span class="budget__bar-value">{{ formatCurrency(cat.monthly_budget) }}</span>
          </div>
          <!-- Actual bar (spent) -->
          <div class="budget__bar-row">
            <span class="budget__bar-label">Realizado</span>
            <div class="budget__bar-track">
              <div
                class="budget__bar-fill"
                :class="actualBarClass(cat)"
                :style="{ width: actualBarWidth(cat) + '%' }"
              ></div>
            </div>
            <span class="budget__bar-value" :class="{ 'budget__bar-value--over': cat.percentage > 100 }">{{ formatCurrency(cat.spent) }}</span>
          </div>
        </div>

        <div class="budget__footer">
          <span v-if="cat.remaining !== null" class="budget__remaining" :class="{ 'budget__remaining--over': cat.remaining < 0 }">
            {{ cat.remaining >= 0 ? 'Resta ' + formatCurrency(cat.remaining) : 'Excedido em ' + formatCurrency(Math.abs(cat.remaining)) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getBrandDetails } from '@/utils/brand'

const props = defineProps({
  categories: { type: Array, default: () => [] }
})

// Only show parent categories (no parent_id) that are 'despesa' and have a monthly_budget > 0
const mainCategories = computed(() =>
  props.categories
    .filter(c => c.type === 'despesa' && !c.parent_id && c.monthly_budget && c.monthly_budget > 0)
    .sort((a, b) => (b.spent || 0) - (a.spent || 0))
)

// The max value across all items, used to compute proportional bar widths
const maxValue = computed(() => {
  let max = 0
  mainCategories.value.forEach(cat => {
    const budget = cat.monthly_budget || 0
    const spent = cat.spent || 0
    if (budget > max) max = budget
    if (spent > max) max = spent
  })
  return max || 1
})

function budgetBarWidth(cat) {
  return Math.min(((cat.monthly_budget || 0) / maxValue.value) * 100, 100)
}

function actualBarWidth(cat) {
  return Math.min(((cat.spent || 0) / maxValue.value) * 100, 100)
}

function actualBarClass(cat) {
  if (cat.percentage > 100) return 'budget__bar-fill--over'
  if (cat.percentage > 80) return 'budget__bar-fill--warning'
  return 'budget__bar-fill--ok'
}

function statusClass(cat) {
  if (cat.percentage === null) return ''
  if (cat.percentage > 100) return 'budget__status--over'
  if (cat.percentage > 80) return 'budget__status--warning'
  return 'budget__status--ok'
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}
</script>

<style scoped>
.budget__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-8) 0;
  text-align: center;
}

.budget__empty p {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
}

.budget__empty span {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.budget__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.budget__item {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-bottom: var(--space-5);
  border-bottom: 1px solid var(--border-subtle);
}

.budget__item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.budget__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.budget__name {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.brand-cell {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.brand-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.budget__status {
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.budget__status--ok {
  background: var(--color-success-subtle);
  color: var(--color-success);
}

.budget__status--warning {
  background: var(--color-warning-subtle);
  color: var(--color-warning);
}

.budget__status--over {
  background: var(--color-danger-subtle);
  color: var(--color-danger);
}

/* Chart */
.budget__chart {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.budget__bar-row {
  display: grid;
  grid-template-columns: 72px 1fr auto;
  align-items: center;
  gap: var(--space-3);
}

.budget__bar-label {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  font-weight: var(--font-medium);
}

.budget__bar-track {
  height: 10px;
  background: var(--bg-subtle);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.budget__bar-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.6s var(--easing-default);
  min-width: 2px;
}

.budget__bar-fill--budget {
  background: var(--border-strong);
  opacity: 0.5;
}

.budget__bar-fill--ok {
  background: linear-gradient(90deg, var(--color-primary-400), var(--color-primary-500));
}

.budget__bar-fill--warning {
  background: linear-gradient(90deg, var(--color-warning-400), var(--color-warning-500));
}

.budget__bar-fill--over {
  background: linear-gradient(90deg, var(--color-danger-400), var(--color-danger-500));
}

.budget__bar-value {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--text-secondary);
  min-width: 80px;
  text-align: right;
}

.budget__bar-value--over {
  color: var(--color-danger);
}

/* Footer */
.budget__footer {
  display: flex;
  justify-content: flex-end;
}

.budget__remaining {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.budget__remaining--over {
  color: var(--color-danger);
  font-weight: var(--font-medium);
}
</style>
