<template>
  <div class="patrimony-overview">
    <BaseCard>
      <template #header>
        <h4>Reservas e Investimentos</h4>
      </template>
      <div class="patrimony-section">
        <div v-for="account in filteredAccounts" :key="account.id" class="patrimony-row">
          <span class="patrimony-row__label">{{ account.name }}</span>
          <span class="patrimony-row__value">{{ formatCurrency(account.balance) }}</span>
        </div>
        <div v-if="!filteredAccounts.length" class="patrimony-empty">
          Nenhuma conta de investimento ou poupança cadastrada
        </div>
      </div>
      <div class="patrimony-total">
        <span>Total</span>
        <span class="patrimony-total__value">{{ formatCurrency(total) }}</span>
      </div>
    </BaseCard>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import BaseCard from '@/components/base/BaseCard.vue'

const props = defineProps({
  accounts: { type: Array, default: () => [] }
})

const filteredAccounts = computed(() =>
  props.accounts.filter(a => a.type === 'investimento' || a.type === 'poupanca')
)

const total = computed(() =>
  filteredAccounts.value.reduce((sum, a) => sum + (a.balance || 0), 0)
)

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}
</script>

<style scoped>
.patrimony-overview {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.patrimony-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.patrimony-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-2) 0;
}

.patrimony-row__label {
  font-size: var(--text-sm);
  color: var(--text-primary);
}

.patrimony-row__value {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-success);
}

.patrimony-empty {
  text-align: center;
  color: var(--text-tertiary);
  font-size: var(--text-sm);
  padding: var(--space-4) 0;
}

.patrimony-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--space-4);
  margin-top: var(--space-2);
  border-top: 1px solid var(--border-subtle);
}

.patrimony-total span:first-child {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.patrimony-total__value {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--color-success);
}
</style>
