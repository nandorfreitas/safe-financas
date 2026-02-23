<template>
  <div class="dashboard-summary">
    <div class="summary-grid">
      <div class="summary-card summary-card--receita">
        <span class="summary-card__label">Receitas</span>
        <span class="summary-card__value">{{ formatCurrency(data?.total_receitas || 0) }}</span>
      </div>
      <div class="summary-card summary-card--despesa">
        <span class="summary-card__label">Despesas</span>
        <span class="summary-card__value">{{ formatCurrency(data?.total_despesas || 0) }}</span>
      </div>
      <div class="summary-card" :class="resultClass">
        <span class="summary-card__label">Resultado</span>
        <span class="summary-card__value">{{ formatCurrency(data?.resultado || 0) }}</span>
      </div>
      <div class="summary-card summary-card--info">
        <span class="summary-card__label">Saldo das Contas</span>
        <span class="summary-card__value">{{ formatCurrency(data?.saldo_contas || 0) }}</span>
      </div>
      <div class="summary-card summary-card--warning">
        <span class="summary-card__label">Cartões</span>
        <span class="summary-card__value">{{ formatCurrency(data?.total_cartao || 0) }}</span>
      </div>
      <div class="summary-card summary-card--patrimonio">
        <span class="summary-card__label">Patrimônio Líquido</span>
        <span class="summary-card__value">{{ formatCurrency(data?.patrimonio?.patrimonio_liquido || 0) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: { type: Object, default: null }
})

const resultClass = computed(() => {
  const res = props.data?.resultado || 0
  return res >= 0 ? 'summary-card--success' : 'summary-card--danger'
})

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}
</script>

<style scoped>
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-4);
}

.summary-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-xl);
  padding: var(--space-5) var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  transition: box-shadow var(--duration-normal) var(--easing-default);
}

.summary-card:hover {
  box-shadow: var(--shadow-sm);
}

.summary-card__label {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-secondary);
}

.summary-card__value {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.summary-card--receita { border-left: 3px solid var(--color-success); }
.summary-card--receita .summary-card__value { color: var(--color-success); }

.summary-card--despesa { border-left: 3px solid var(--color-danger); }
.summary-card--despesa .summary-card__value { color: var(--color-danger); }

.summary-card--success { border-left: 3px solid var(--color-success); }
.summary-card--success .summary-card__value { color: var(--color-success); }

.summary-card--danger { border-left: 3px solid var(--color-danger); }
.summary-card--danger .summary-card__value { color: var(--color-danger); }

.summary-card--info { border-left: 3px solid var(--color-info); }
.summary-card--info .summary-card__value { color: var(--color-info); }

.summary-card--warning { border-left: 3px solid var(--color-warning); }
.summary-card--warning .summary-card__value { color: var(--color-warning); }

.summary-card--patrimonio { border-left: 3px solid var(--btn-primary-bg); }
.summary-card--patrimonio .summary-card__value { color: var(--btn-primary-bg); }
</style>
