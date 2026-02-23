<template>
  <div class="view">
    <div class="view__header">
      <div>
        <h1 class="view__title">Cartões de Crédito</h1>
        <p class="view__subtitle">Gerenciar cartões e acompanhar faturas</p>
      </div>
      <BaseButton @click="showModal = true">Novo Cartão</BaseButton>
    </div>

    <div class="cards-grid">
      <CreditCardCard
        v-for="card in creditCardsStore.cards"
        :key="card.id"
        :card="card"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </div>

    <p v-if="!creditCardsStore.cards.length && !creditCardsStore.loading" class="empty-state">
      Nenhum cartão cadastrado. Adicione seu primeiro cartão.
    </p>

    <BaseModal v-model="showModal" :title="editing ? 'Editar Cartão' : 'Novo Cartão'">
      <form @submit.prevent="handleSubmit" class="form">
        <BaseInput v-model="form.name" label="Nome" placeholder="Ex: Nubank Platinum" />
        <BaseInput v-model="form.limit_total" label="Limite Total" type="number" step="0.01" placeholder="0,00" />
        <BaseInput v-model="form.closing_day" label="Dia de Fechamento" type="number" min="1" max="31" />
        <BaseInput v-model="form.due_day" label="Dia de Vencimento" type="number" min="1" max="31" />
        <BaseSelect v-model="form.payment_account_id" label="Conta de Pagamento" :options="accountOptions" placeholder="Selecione..." />
        <BaseCheckbox v-model="form.active" label="Ativo" />
        <div class="form__actions">
          <BaseButton variant="secondary" @click="closeModal">Cancelar</BaseButton>
          <BaseButton type="submit">{{ editing ? 'Salvar' : 'Criar' }}</BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseCheckbox from '@/components/base/BaseCheckbox.vue'
import CreditCardCard from '@/components/financial/CreditCardCard.vue'
import { useCreditCardsStore } from '@/stores/creditCards'
import { useAccountsStore } from '@/stores/accounts'

const creditCardsStore = useCreditCardsStore()
const accountsStore = useAccountsStore()

const showModal = ref(false)
const editing = ref(false)
const editingId = ref(null)

const form = reactive({ name: '', limit_total: 0, closing_day: 1, due_day: 10, payment_account_id: '', active: true })

const accountOptions = computed(() =>
  accountsStore.accounts.map(a => ({ value: a.id, label: a.name }))
)

function handleEdit(card) {
  editing.value = true
  editingId.value = card.id
  Object.assign(form, {
    name: card.name,
    limit_total: card.limit_total,
    closing_day: card.closing_day,
    due_day: card.due_day,
    payment_account_id: card.payment_account_id || '',
    active: !!card.active
  })
  showModal.value = true
}

function handleDelete(card) {
  if (confirm('Excluir este cartão?')) {
    creditCardsStore.deleteCard(card.id)
  }
}

async function handleSubmit() {
  const payload = {
    ...form,
    limit_total: parseFloat(form.limit_total) || 0,
    closing_day: parseInt(form.closing_day),
    due_day: parseInt(form.due_day),
    payment_account_id: form.payment_account_id ? Number(form.payment_account_id) : null,
    active: form.active ? 1 : 0
  }
  if (editing.value) {
    await creditCardsStore.updateCard(editingId.value, payload)
  } else {
    await creditCardsStore.createCard(payload)
  }
  closeModal()
}

function closeModal() {
  showModal.value = false
  editing.value = false
  editingId.value = null
  Object.assign(form, { name: '', limit_total: 0, closing_day: 1, due_day: 10, payment_account_id: '', active: true })
}

onMounted(() => {
  creditCardsStore.fetchCards()
  accountsStore.fetchAccounts()
})
</script>

<style scoped>
.view { display: flex; flex-direction: column; gap: var(--space-6); }
.view__header { display: flex; justify-content: space-between; align-items: flex-start; }
.view__title { font-size: var(--text-2xl); font-weight: var(--font-bold); color: var(--text-primary); }
.view__subtitle { font-size: var(--text-sm); color: var(--text-secondary); margin-top: var(--space-1); }
.cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: var(--space-4); }
.form { display: flex; flex-direction: column; gap: var(--space-4); }
.form__actions { display: flex; justify-content: flex-end; gap: var(--space-3); margin-top: var(--space-4); padding-top: var(--space-4); border-top: 1px solid var(--border-subtle); }
.empty-state { text-align: center; color: var(--text-tertiary); font-size: var(--text-sm); padding: var(--space-10) 0; }
</style>
