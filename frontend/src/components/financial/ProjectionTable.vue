<template>
  <div class="projection-table">
    <BaseTable :columns="columns" :data="projections" empty-text="Nenhuma projeção disponível">
      <template #cell-receitas="{ value }">
        <span class="value value--success">{{ formatCurrency(value) }}</span>
      </template>
      <template #cell-despesas="{ value }">
        <span class="value value--danger">{{ formatCurrency(value) }}</span>
      </template>
      <template #cell-resultado="{ value }">
        <span :class="['value', value >= 0 ? 'value--success' : 'value--danger']">
          {{ formatCurrency(value) }}
        </span>
      </template>
      <template #cell-saldo_acumulado="{ value }">
        <span :class="['value', value >= 0 ? 'value--success' : 'value--danger']">
          {{ formatCurrency(value) }}
        </span>
      </template>
      <template #cell-total_gastos_cartao="{ value }">
        <span class="value value--info">{{ formatCurrency(value) }}</span>
      </template>
      <template #cell-faturas_pendentes="{ value }">
        <span class="value value--warning">{{ formatCurrency(value) }}</span>
      </template>
      <template #cell-patrimonio_projetado="{ value }">
        <span :class="['value', 'value--bold', value >= 0 ? 'value--success' : 'value--danger']">
          {{ formatCurrency(value) }}
        </span>
      </template>
    </BaseTable>
  </div>
</template>

<script setup>
import BaseTable from '@/components/base/BaseTable.vue'

defineProps({
  projections: { type: Array, default: () => [] }
})

const columns = [
  { key: 'competence', label: 'Mês' },
  { key: 'receitas', label: 'Receitas' },
  { key: 'despesas', label: 'Dinheiro' },
  { key: 'resultado', label: 'Resultado' },
  { key: 'saldo_acumulado', label: 'Saldo Acum.' },
  { key: 'total_gastos_cartao', label: 'Cartões (Gasto)' },
  { key: 'faturas_pendentes', label: 'Faturas (A Pagar)' },
  { key: 'patrimonio_projetado', label: 'Patrimônio' }
]

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}
</script>

<style scoped>
.value { font-weight: var(--font-medium); font-size: var(--text-sm); }
.value--success { color: var(--color-success); }
.value--danger { color: var(--color-danger); }
.value--warning { color: var(--color-warning); }
.value--info { color: var(--color-info); }
.value--bold { font-weight: var(--font-semibold); }
</style>
