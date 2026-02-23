<template>
  <div class="budget-list">
    <div v-for="cat in budgetItems" :key="cat.id" class="budget-item">
      <div class="budget-item__header">
        <span class="budget-item__name">{{ cat.name }}</span>
        <div class="budget-item__values">
          <span class="budget-item__spent">{{ formatCurrency(cat.spent) }}</span>
          <span v-if="cat.monthly_budget" class="budget-item__separator">/</span>
          <span v-if="cat.monthly_budget" class="budget-item__budget">{{ formatCurrency(cat.monthly_budget) }}</span>
        </div>
      </div>
      <div v-if="cat.monthly_budget" class="budget-item__bar">
        <div
          class="budget-item__fill"
          :class="{ 'budget-item__fill--over': cat.percentage > 100, 'budget-item__fill--warning': cat.percentage > 80 && cat.percentage <= 100 }"
          :style="{ width: Math.min(cat.percentage, 100) + '%' }"
        />
      </div>
      <span v-if="cat.percentage !== null" class="budget-item__percentage" :class="{ 'budget-item__percentage--over': cat.percentage > 100 }">
        {{ cat.percentage }}%
      </span>
    </div>
    <p v-if="!budgetItems.length" class="budget-empty">Nenhuma categoria com orçamento definido</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  categories: { type: Array, default: () => [] }
})

const budgetItems = computed(() =>
  props.categories.filter(c => c.type === 'despesa')
)

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}
</script>

<style scoped>
.budget-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.budget-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.budget-item__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.budget-item__name {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
}

.budget-item__values {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-sm);
}

.budget-item__spent {
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.budget-item__separator {
  color: var(--text-tertiary);
}

.budget-item__budget {
  color: var(--text-secondary);
}

.budget-item__bar {
  height: 6px;
  background: var(--bg-subtle);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.budget-item__fill {
  height: 100%;
  background: var(--color-success);
  border-radius: var(--radius-full);
  transition: width var(--duration-slow) var(--easing-default);
}

.budget-item__fill--warning {
  background: var(--color-warning);
}

.budget-item__fill--over {
  background: var(--color-danger);
}

.budget-item__percentage {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  text-align: right;
}

.budget-item__percentage--over {
  color: var(--color-danger);
  font-weight: var(--font-medium);
}

.budget-empty {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  text-align: center;
  padding: var(--space-8) 0;
}
</style>
