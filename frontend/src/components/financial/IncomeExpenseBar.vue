<template>
  <div class="ie-bars">
    <div v-if="!hasData" class="ie-bars__empty">
      <p>Sem dados para este mês</p>
    </div>
    <template v-else>
      <!-- Receitas -->
      <div class="ie-bars__row">
        <div class="ie-bars__label">
          <span class="ie-bars__label-text">Receitas</span>
          <span class="ie-bars__label-value ie-bars__label-value--success">{{ formatCurrency(receitas) }}</span>
        </div>
        <div class="ie-bars__track">
          <div
            class="ie-bars__fill ie-bars__fill--success"
            :style="{ width: barWidth(receitas) + '%' }"
          ></div>
        </div>
      </div>

      <!-- Despesas -->
      <div class="ie-bars__row">
        <div class="ie-bars__label">
          <span class="ie-bars__label-text">Despesas (Débito, pix, pagamentos de contas)</span>
          <span class="ie-bars__label-value ie-bars__label-value--danger">{{ formatCurrency(despesas) }}</span>
        </div>
        <div class="ie-bars__track">
          <div
            class="ie-bars__fill ie-bars__fill--danger"
            :style="{ width: barWidth(despesas) + '%' }"
          ></div>
        </div>
      </div>

      <!-- Gastos no Crédito -->
      <div class="ie-bars__row">
        <div class="ie-bars__label">
          <span class="ie-bars__label-text">Gastos no Crédito</span>
          <span class="ie-bars__label-value ie-bars__label-value--danger">{{ formatCurrency(gastos_cartao) }}</span>
        </div>
        <div class="ie-bars__track">
          <div
            class="ie-bars__fill ie-bars__fill--danger"
            :style="{ width: barWidth(gastos_cartao) + '%' }"
          ></div>
        </div>
      </div>

      <!-- Resultado -->
      <div class="ie-bars__result" :class="resultClass">
        <span class="ie-bars__result-label">Resultado</span>
        <span class="ie-bars__result-value">{{ resultado >= 0 ? '+' : '' }}{{ formatCurrency(resultado) }}</span>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: { type: Object, default: () => ({}) }
})

const receitas = computed(() => props.data?.total_receitas || 0)
const despesas = computed(() => props.data?.total_despesas || 0)
const gastos_cartao = computed(() => props.data?.total_gastos_cartao || 0)
const resultado = computed(() => props.data?.resultado || 0)
const hasData = computed(() => receitas.value > 0 || despesas.value > 0)

const maxVal = computed(() => Math.max(receitas.value, despesas.value, gastos_cartao.value) || 1)

function barWidth(value) {
  return Math.min((value / maxVal.value) * 100, 100)
}

const resultClass = computed(() => ({
  'ie-bars__result--positive': resultado.value >= 0,
  'ie-bars__result--negative': resultado.value < 0
}))

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}
</script>

<style scoped>
.ie-bars {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.ie-bars__empty {
  text-align: center;
  padding: var(--space-8) 0;
}

.ie-bars__empty p {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

.ie-bars__row {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.ie-bars__label {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ie-bars__label-text {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
}

.ie-bars__label-value {
  font-size: var(--text-md);
  font-weight: var(--font-bold);
}

.ie-bars__label-value--success { color: var(--color-success); }
.ie-bars__label-value--danger { color: var(--color-danger); }

.ie-bars__track {
  height: 12px;
  background: var(--bg-subtle);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.ie-bars__fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.6s ease;
  min-width: 4px;
}

.ie-bars__fill--success {
  background: linear-gradient(90deg, var(--color-primary-300), var(--color-primary-500));
}

.ie-bars__fill--danger {
  background: linear-gradient(90deg, var(--color-danger-300), var(--color-danger-500));
}

.ie-bars__result {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg);
  margin-top: var(--space-1);
}

.ie-bars__result--positive {
  background: var(--color-success-subtle);
}

.ie-bars__result--negative {
  background: var(--color-danger-subtle);
}

.ie-bars__result-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
}

.ie-bars__result-value {
  font-size: var(--text-md);
  font-weight: var(--font-bold);
}

.ie-bars__result--positive .ie-bars__result-value {
  color: var(--color-success);
}

.ie-bars__result--negative .ie-bars__result-value {
  color: var(--color-danger);
}
</style>
