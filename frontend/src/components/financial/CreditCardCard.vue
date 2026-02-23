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
      <div v-if="card.available !== undefined" class="card-stat">
        <span class="card-stat__label">Disponível</span>
        <span :class="['card-stat__value', card.available >= 0 ? 'card-stat__value--success' : 'card-stat__value--danger']">
          {{ formatCurrency(card.available) }}
        </span>
      </div>
    </div>
    <div v-if="card.payment_account_name" class="card-footer-info">
      Pagamento: {{ card.payment_account_name }}
    </div>
  </BaseCard>
</template>

<script setup>
import BaseCard from '@/components/base/BaseCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'

defineProps({
  card: { type: Object, required: true }
})

defineEmits(['edit', 'delete'])

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
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

.card-footer-info {
  margin-top: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px solid var(--border-subtle);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}
</style>
