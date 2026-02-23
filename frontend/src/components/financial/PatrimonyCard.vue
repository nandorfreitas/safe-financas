<template>
  <div class="patrimony-overview">
    <div class="patrimony-grid">
      <BaseCard>
        <template #header>
          <h4>Ativos</h4>
        </template>
        <div class="patrimony-section">
          <div v-for="account in accounts" :key="account.id" class="patrimony-row">
            <span class="patrimony-row__label">{{ account.name }}</span>
            <span class="patrimony-row__value patrimony-row__value--success">{{ formatCurrency(account.balance) }}</span>
          </div>
          <div class="patrimony-total">
            <span>Total Ativos</span>
            <span class="patrimony-total__value patrimony-total__value--success">{{ formatCurrency(totalAtivos) }}</span>
          </div>
        </div>
      </BaseCard>

      <BaseCard>
        <template #header>
          <h4>Passivos</h4>
        </template>
        <div class="patrimony-section">
          <div v-for="card in cards" :key="card.id" class="patrimony-row">
            <span class="patrimony-row__label">{{ card.name }}</span>
            <span class="patrimony-row__value patrimony-row__value--danger">{{ formatCurrency(card.invoice_total || 0) }}</span>
          </div>
          <div class="patrimony-total">
            <span>Total Passivos</span>
            <span class="patrimony-total__value patrimony-total__value--danger">{{ formatCurrency(totalPassivos) }}</span>
          </div>
        </div>
      </BaseCard>
    </div>

    <BaseCard>
      <div class="patrimony-net">
        <span class="patrimony-net__label">Patrimônio Líquido</span>
        <span :class="['patrimony-net__value', patrimonioLiquido >= 0 ? 'patrimony-net__value--success' : 'patrimony-net__value--danger']">
          {{ formatCurrency(patrimonioLiquido) }}
        </span>
      </div>
    </BaseCard>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import BaseCard from '@/components/base/BaseCard.vue'

const props = defineProps({
  accounts: { type: Array, default: () => [] },
  cards: { type: Array, default: () => [] }
})

const totalAtivos = computed(() => props.accounts.reduce((sum, a) => sum + (a.balance || 0), 0))
const totalPassivos = computed(() => props.cards.reduce((sum, c) => sum + (c.invoice_total || 0), 0))
const patrimonioLiquido = computed(() => totalAtivos.value - totalPassivos.value)

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

.patrimony-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
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
}

.patrimony-row__value--success { color: var(--color-success); }
.patrimony-row__value--danger { color: var(--color-danger); }

.patrimony-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--space-3);
  border-top: 1px solid var(--border-subtle);
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
  color: var(--text-primary);
}

.patrimony-total__value--success { color: var(--color-success); }
.patrimony-total__value--danger { color: var(--color-danger); }

.patrimony-net {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.patrimony-net__label {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.patrimony-net__value {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
}

.patrimony-net__value--success { color: var(--color-success); }
.patrimony-net__value--danger { color: var(--color-danger); }
</style>
