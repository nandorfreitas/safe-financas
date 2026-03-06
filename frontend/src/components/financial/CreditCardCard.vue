<template>
  <BaseCard hoverable>
    <template #header>
      <div class="card-header">
        <div>
          <h4 class="card-name">{{ card.name }}</h4>
          <span class="card-meta">Fecha dia {{ card.closing_day }} · Vence dia {{ card.due_day }}</span>
        </div>
        <div class="card-actions">
          <BaseButton variant="ghost" size="sm" @click="$emit('edit', card)">Editar</BaseButton>
          <BaseButton variant="ghost" size="sm" @click="$emit('delete', card)">Excluir</BaseButton>
        </div>
      </div>
    </template>
    <div class="card-body">
      <div class="card-stat">
        <span class="card-stat__label">Limite Total</span>
        <span class="card-stat__value">{{ formatCurrency(card.limit_total) }}</span>
      </div>
      <div v-if="card.invoice_total !== undefined" class="card-stat">
        <span class="card-stat__label">Fatura Atual</span>
        <span class="card-stat__value card-stat__value--danger">{{ formatCurrency(card.invoice_total) }}</span>
      </div>
    </div>
    
    <div v-if="projections.length > 0" class="card-projections">
      <h5 class="card-projections__title">Próximas Faturas</h5>
      <ul class="card-projections__list">
        <li v-for="proj in projections" :key="proj.competence" class="card-projections__item">
          <span>{{ formatMonth(proj.competence) }}</span>
          <span class="card-projections__value">{{ formatCurrency(proj.total) }}</span>
        </li>
      </ul>
    </div>

    <div v-if="card.payment_account_name" class="card-footer-info">
      Pagamento: {{ card.payment_account_name }}
    </div>
  </BaseCard>
</template>

<script setup>
import { computed } from 'vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'

const props = defineProps({
  card: { type: Object, required: true }
})

defineEmits(['edit', 'delete'])

const projections = computed(() => props.card.projections || [])

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatMonth(competence) {
  if (!competence) return ''
  const [year, month] = competence.split('-')
  const date = new Date(year, month - 1)
  const monthName = date.toLocaleString('pt-BR', { month: 'short' })
  return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)}/${year}`
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.card-name {
  font-size: var(--text-md);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.card-meta {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  margin-top: var(--space-1);
  display: block;
}

.card-actions {
  display: flex;
  gap: var(--space-1);
}

.card-body {
  display: flex;
  gap: var(--space-8);
  flex-wrap: wrap;
}

.card-stat {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.card-stat__label {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.card-stat__value {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.card-stat__value--success { color: var(--color-success); }
.card-stat__value--danger { color: var(--color-danger); }

.card-projections {
  margin-top: var(--space-4);
  padding-top: var(--space-3);
  border-top: 1px dashed var(--border-subtle);
}

.card-projections__title {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: var(--space-2);
}

.card-projections__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.card-projections__item {
  display: flex;
  justify-content: space-between;
  font-size: var(--text-sm);
  color: var(--text-primary);
}

.card-projections__value {
  color: var(--color-danger);
  font-weight: var(--font-medium);
}

.card-footer-info {
  margin-top: var(--space-4);
  padding-top: var(--space-3);
  border-top: 1px solid var(--border-subtle);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}
</style>
