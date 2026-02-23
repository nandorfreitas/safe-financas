<template>
  <form class="transaction-form" @submit.prevent="handleSubmit">
    <div class="transaction-form__grid">
      <BaseInput v-model="form.description" label="Descrição" placeholder="Ex: Aluguel" />
      <BaseInput v-model="form.amount" label="Valor" type="number" step="0.01" min="0" placeholder="0,00" />
      <BaseSelect v-model="form.type" label="Tipo" :options="typeOptions" />
      <BaseSelect v-model="form.category_id" label="Categoria" :options="categoryOptions" placeholder="Selecione..." />
      <BaseSelect v-model="form.account_id" label="Conta" :options="accountOptions" placeholder="Selecione..." />
      <BaseSelect v-if="form.type === 'despesa'" v-model="form.credit_card_id" label="Cartão (opcional)" :options="creditCardOptions" placeholder="Nenhum" />
      <BaseInput v-model="form.launch_date" label="Data Lançamento" type="date" />
      <BaseInput v-model="form.competence" label="Competência" type="month" />
      <BaseInput v-model="form.due_date" label="Vencimento" type="date" />
      <BaseSelect v-model="form.status" label="Status" :options="statusOptions" />
      <BaseInput v-model="form.installment_total" label="Parcelas" type="number" min="1" placeholder="1" />
      <BaseCheckbox v-model="form.fixed" label="Despesa fixa" />
    </div>

    <div v-if="form.type === 'transferencia'" class="transaction-form__transfer">
      <BaseSelect v-model="form.subtype" label="Conta Destino" :options="accountOptions" placeholder="Selecione destino..." />
    </div>

    <div class="transaction-form__actions">
      <BaseButton variant="secondary" @click="$emit('cancel')">Cancelar</BaseButton>
      <BaseButton type="submit" :loading="loading">{{ editing ? 'Salvar' : 'Criar' }}</BaseButton>
    </div>
  </form>
</template>

<script setup>
import { reactive, computed } from 'vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseCheckbox from '@/components/base/BaseCheckbox.vue'
import BaseButton from '@/components/base/BaseButton.vue'

const props = defineProps({
  accounts: { type: Array, default: () => [] },
  categories: { type: Array, default: () => [] },
  creditCards: { type: Array, default: () => [] },
  initial: { type: Object, default: null },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['submit', 'cancel'])

const editing = computed(() => !!props.initial?.id)

const today = new Date().toISOString().split('T')[0]
const currentMonth = today.slice(0, 7)

const form = reactive({
  description: props.initial?.description || '',
  amount: props.initial?.amount || '',
  type: props.initial?.type || 'despesa',
  category_id: props.initial?.category_id || '',
  account_id: props.initial?.account_id || '',
  credit_card_id: props.initial?.credit_card_id || '',
  launch_date: props.initial?.launch_date || today,
  competence: props.initial?.competence || currentMonth,
  due_date: props.initial?.due_date || '',
  status: props.initial?.status || 'previsto',
  fixed: props.initial?.fixed ? true : false,
  installment_total: props.initial?.installment_total || 1,
  subtype: props.initial?.subtype || ''
})

const typeOptions = [
  { value: 'receita', label: 'Receita' },
  { value: 'despesa', label: 'Despesa' },
  { value: 'transferencia', label: 'Transferência' }
]

const statusOptions = [
  { value: 'previsto', label: 'Previsto' },
  { value: 'pago', label: 'Pago' }
]

const categoryOptions = computed(() =>
  props.categories.map(c => ({ value: c.id, label: c.name }))
)

const accountOptions = computed(() =>
  props.accounts.map(a => ({ value: a.id, label: a.name }))
)

const creditCardOptions = computed(() => [
  { value: '', label: 'Nenhum' },
  ...props.creditCards.map(c => ({ value: c.id, label: c.name }))
])

function handleSubmit() {
  emit('submit', {
    ...form,
    amount: parseFloat(form.amount) || 0,
    category_id: form.category_id ? Number(form.category_id) : null,
    account_id: form.account_id ? Number(form.account_id) : null,
    credit_card_id: form.credit_card_id ? Number(form.credit_card_id) : null,
    installment_total: parseInt(form.installment_total) || 1,
    fixed: form.fixed ? 1 : 0
  })
}
</script>

<style scoped>
.transaction-form__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-4);
}

.transaction-form__transfer {
  margin-top: var(--space-4);
}

.transaction-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-6);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border-subtle);
}
</style>
