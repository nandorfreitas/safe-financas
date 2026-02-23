<template>
  <div class="transaction-list">
    <BaseTable :columns="columns" :data="transactions" empty-text="Nenhuma transação encontrada">
      <template #cell-type="{ value }">
        <BaseBadge :variant="typeBadge(value)">{{ typeLabel(value) }}</BaseBadge>
      </template>
      <template #cell-amount="{ row }">
        <span :class="['amount', `amount--${row.type}`]">
          {{ row.type === 'receita' ? '+' : '-' }}{{ formatCurrency(row.amount) }}
        </span>
      </template>
      <template #cell-status="{ value }">
        <BaseBadge :variant="value === 'pago' ? 'success' : 'warning'">{{ value === 'pago' ? 'Pago' : 'Previsto' }}</BaseBadge>
      </template>
      <template #cell-installment_number="{ row }">
        <span v-if="row.installment_total > 1">{{ row.installment_number }}/{{ row.installment_total }}</span>
        <span v-else>—</span>
      </template>
      <template #actions="{ row }">
        <div class="action-buttons">
          <BaseButton variant="ghost" size="sm" @click="$emit('edit', row)">Editar</BaseButton>
          <BaseButton variant="ghost" size="sm" @click="$emit('delete', row)">Excluir</BaseButton>
        </div>
      </template>
    </BaseTable>
  </div>
</template>

<script setup>
import BaseTable from '@/components/base/BaseTable.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseButton from '@/components/base/BaseButton.vue'

defineProps({
  transactions: { type: Array, default: () => [] }
})

defineEmits(['edit', 'delete'])

const columns = [
  { key: 'description', label: 'Descrição' },
  { key: 'amount', label: 'Valor', format: 'currency' },
  { key: 'type', label: 'Tipo' },
  { key: 'category_name', label: 'Categoria' },
  { key: 'account_name', label: 'Conta' },
  { key: 'competence', label: 'Competência' },
  { key: 'status', label: 'Status' },
  { key: 'installment_number', label: 'Parcela' }
]

function typeBadge(type) {
  const map = { receita: 'success', despesa: 'danger', transferencia: 'info' }
  return map[type] || 'default'
}

function typeLabel(type) {
  const map = { receita: 'Receita', despesa: 'Despesa', transferencia: 'Transferência' }
  return map[type] || type
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}
</script>

<style scoped>
.amount { font-weight: var(--font-semibold); font-size: var(--text-sm); }
.amount--receita { color: var(--color-success); }
.amount--despesa { color: var(--color-danger); }
.amount--transferencia { color: var(--color-info); }

.action-buttons {
  display: flex;
  gap: var(--space-1);
}
</style>
