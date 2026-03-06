<template>
  <div class="view">
    <div class="view__header">
      <div>
        <h1 class="view__title">Projeção Financeira</h1>
        <p class="view__subtitle">Projeção de fluxo de caixa para os próximos 12 meses</p>
      </div>
    </div>

    <BaseCard title="Evolução Projetada" subtitle="Receitas, despesas e patrimônio ao longo dos meses">
      <ProjectionChart :projections="projectionStore.projections" />
    </BaseCard>

    <ProjectionTable :projections="projectionStore.projections" />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import BaseCard from '@/components/base/BaseCard.vue'
import ProjectionChart from '@/components/financial/ProjectionChart.vue'
import ProjectionTable from '@/components/financial/ProjectionTable.vue'
import { useProjectionStore } from '@/stores/projection'

const projectionStore = useProjectionStore()

onMounted(() => projectionStore.fetchProjection(12))
</script>

<style scoped>
.view { display: flex; flex-direction: column; gap: var(--space-6); }
.view__header { display: flex; justify-content: space-between; align-items: flex-start; }
.view__title { font-size: var(--text-2xl); font-weight: var(--font-bold); color: var(--text-primary); }
.view__subtitle { font-size: var(--text-sm); color: var(--text-secondary); margin-top: var(--space-1); }
</style>
