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
        <BaseBadge :variant="value === 'pago' ? 'success' : (value === 'cartao' ? 'info' : 'warning')">{{ value === 'pago' ? 'Pago' : (value === 'cartao' ? 'Cartão' : 'Previsto') }}</BaseBadge>
      </template>
      <template #cell-installment_number="{ row }">
        <span v-if="row.installment_total > 1">{{ row.installment_number }}/{{ row.installment_total }}</span>
        <span v-else>—</span>
      </template>
      <template #cell-account_name="{ value }">
        <div v-if="value" class="brand-cell">
          <span class="brand-badge" :style="{ backgroundColor: getBrandDetails(value, 'bank').color, color: getBrandDetails(value, 'bank').text }">
            {{ getBrandDetails(value, 'bank').initial }}
          </span>
          <span>{{ value }}</span>
        </div>
        <span v-else>—</span>
      </template>
      <template #cell-credit_card_name="{ value }">
        <div v-if="value" class="brand-cell">
          <span class="brand-badge" :style="{ backgroundColor: getBrandDetails(value, 'card').color, color: getBrandDetails(value, 'card').text }">
            {{ getBrandDetails(value, 'card').initial }}
          </span>
          <span>{{ value }}</span>
        </div>
        <span v-else>—</span>
      </template>
      <template #cell-category_name="{ value }">
        <div v-if="value" class="brand-cell">
          <span class="brand-dot" :style="{ backgroundColor: getBrandDetails(value, 'tag').color }"></span>
          <span>{{ value }}</span>
        </div>
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
import { getBrandDetails } from '@/utils/brand'

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
  { key: 'credit_card_name', label: 'Cartão' },
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

.brand-cell {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.brand-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-md);
  font-size: 10px;
  font-weight: var(--font-bold);
  flex-shrink: 0;
}

.brand-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
</style>
