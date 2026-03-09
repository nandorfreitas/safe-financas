<template>
  <BaseCard hoverable>
    <template #header>
      <div class="account-header">
        <div class="account-title-wrap">
          <span class="brand-badge" :style="{ backgroundColor: getBrandDetails(account.name, 'bank').color, color: getBrandDetails(account.name, 'bank').text }">
            {{ getBrandDetails(account.name, 'bank').initial }}
          </span>
          <div>
            <h4 class="account-name">{{ account.name }}</h4>
            <BaseBadge>{{ typeLabel }}</BaseBadge>
          </div>
        </div>
        <div class="account-actions">
          <BaseButton variant="ghost" size="sm" @click="$emit('edit', account)">Editar</BaseButton>
          <BaseButton variant="ghost" size="sm" @click="$emit('delete', account)">Excluir</BaseButton>
        </div>
      </div>
    </template>
    <div class="account-body">
      <div class="account-stat">
        <span class="account-stat__label">Saldo Inicial</span>
        <span class="account-stat__value">{{ formatCurrency(account.initial_balance) }}</span>
      </div>
      <div v-if="account.balance !== undefined" class="account-stat">
        <span class="account-stat__label">Saldo Atual</span>
        <span :class="['account-stat__value', 'account-stat__value--highlight', account.balance >= 0 ? 'account-stat__value--success' : 'account-stat__value--danger']">
          {{ formatCurrency(account.balance) }}
        </span>
      </div>
    </div>
  </BaseCard>
</template>

<script setup>
import { computed } from 'vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { getBrandDetails } from '@/utils/brand'

const props = defineProps({
  account: { type: Object, required: true }
})

defineEmits(['edit', 'delete'])

const typeLabels = { corrente: 'Corrente', poupanca: 'Poupança', investimento: 'Investimento', carteira: 'Carteira' }
const typeLabel = computed(() => typeLabels[props.account.type] || props.account.type)

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}
</script>

<style scoped>
.account-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: var(--space-4);
}

.account-title-wrap {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
  flex: 1 1 160px;
}

.brand-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: var(--font-bold);
  flex-shrink: 0;
}

.account-name {
  font-size: var(--text-md);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.account-actions {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  flex-wrap: wrap;
  justify-content: flex-start;
  flex: 0 0 auto;
}

.account-body {
  display: flex;
  gap: var(--space-8);
}

.account-stat {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.account-stat__label {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.account-stat__value {
  font-size: var(--text-base);
  color: var(--text-primary);
}

.account-stat__value--highlight {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
}

.account-stat__value--success { color: var(--color-success); }
.account-stat__value--danger { color: var(--color-danger); }
</style>
