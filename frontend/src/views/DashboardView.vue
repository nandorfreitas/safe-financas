<template>
  <div class="view">
    <div class="view__header">
      <div>
        <h1 class="view__title">Dashboard</h1>
        <p class="view__subtitle">Visão geral das suas finanças</p>
      </div>
      <div class="view__competence">
        <BaseButton variant="ghost" size="sm" @click="prevMonth">←</BaseButton>
        <span class="view__month">{{ formatMonth(competence) }}</span>
        <BaseButton variant="ghost" size="sm" @click="nextMonth">→</BaseButton>
      </div>
    </div>

    <DashboardSummary :data="dashboard.data" />

    <div class="view__section">
      <BaseCard title="Orçamento por Categoria" subtitle="Acompanhamento mensal">
        <CategoryBudget :categories="categoriesStore.budget" />
      </BaseCard>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import DashboardSummary from '@/components/financial/DashboardSummary.vue'
import CategoryBudget from '@/components/financial/CategoryBudget.vue'
import { useDashboardStore } from '@/stores/dashboard'
import { useCategoriesStore } from '@/stores/categories'

const dashboard = useDashboardStore()
const categoriesStore = useCategoriesStore()

const today = new Date()
const competence = ref(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`)

function fetchData() {
  dashboard.fetchDashboard(competence.value)
  categoriesStore.fetchBudget(competence.value)
}

function prevMonth() {
  const [y, m] = competence.value.split('-').map(Number)
  const d = new Date(y, m - 2, 1)
  competence.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function nextMonth() {
  const [y, m] = competence.value.split('-').map(Number)
  const d = new Date(y, m, 1)
  competence.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function formatMonth(comp) {
  const [y, m] = comp.split('-')
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${months[parseInt(m) - 1]} ${y}`
}

watch(competence, fetchData)
onMounted(fetchData)
</script>

<style scoped>
.view {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.view__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.view__title {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
}

.view__subtitle {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-top: var(--space-1);
}

.view__competence {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.view__month {
  font-size: var(--text-md);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  min-width: 100px;
  text-align: center;
}

.view__section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
</style>
