<template>
  <div class="view">
    <div class="view__header">
      <div>
        <h1 class="view__title">Transações</h1>
        <p class="view__subtitle">Gerenciar receitas, despesas e transferências</p>
      </div>
      <div class="view__actions">
        <div class="view__competence">
          <BaseButton variant="ghost" size="sm" @click="prevMonth">←</BaseButton>
          <span class="view__month">{{ formatMonth(competence) }}</span>
          <BaseButton variant="ghost" size="sm" @click="nextMonth">→</BaseButton>
        </div>
        <BaseButton @click="showModal = true">Nova Transação</BaseButton>
      </div>
    </div>

    <TransactionList
      :transactions="transactionsStore.transactions"
      @edit="handleEdit"
      @delete="handleDelete"
    />

    <BaseModal v-model="showModal" :title="editing ? 'Editar Transação' : 'Nova Transação'" size="lg">
      <TransactionForm
        :accounts="accountsStore.accounts"
        :categories="categoriesStore.categories"
        :credit-cards="creditCardsStore.cards"
        :initial="editingTransaction"
        @submit="handleSubmit"
        @cancel="closeModal"
      />
    </BaseModal>

    <ConfirmDialog
      v-model="showConfirm"
      :title="confirmConfig.title"
      :message="confirmConfig.message"
      :variant="confirmConfig.variant"
      :actions="confirmConfig.actions"
      @select="handleConfirmAction"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import ConfirmDialog from '@/components/base/ConfirmDialog.vue'
import TransactionList from '@/components/financial/TransactionList.vue'
import TransactionForm from '@/components/financial/TransactionForm.vue'
import { useTransactionsStore } from '@/stores/transactions'
import { useAccountsStore } from '@/stores/accounts'
import { useCategoriesStore } from '@/stores/categories'
import { useCreditCardsStore } from '@/stores/creditCards'

const transactionsStore = useTransactionsStore()
const accountsStore = useAccountsStore()
const categoriesStore = useCategoriesStore()
const creditCardsStore = useCreditCardsStore()

const showModal = ref(false)
const editing = ref(false)
const editingTransaction = ref(null)

const showConfirm = ref(false)
const confirmConfig = ref({ title: '', message: '', variant: 'info', actions: [] })
const pendingAction = ref(null)

const today = new Date()
const competence = ref(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`)

function fetchData() {
  transactionsStore.fetchTransactions({ competence: competence.value })
}

function prevMonth() {
  const [y, m] = competence.value.split('-').map(Number)
  const d = new Date(y, m - 2, 1)
  competence.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function nextMonth() {
  const [y, m] = competence.value.split('-').map(Number)
  const d = new Date(y, m, 1)
  competence.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function formatMonth(comp) {
  const [y, m] = comp.split('-')
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${months[parseInt(m) - 1]} ${y}`
}

function handleEdit(transaction) {
  editing.value = true
  editingTransaction.value = { ...transaction }
  showModal.value = true
}

function handleDelete(transaction) {
  if (transaction.fixed) {
    pendingAction.value = { type: 'delete', transaction }
    confirmConfig.value = {
      title: 'Excluir transação fixa',
      message: `"${transaction.description}" é uma transação fixa. Deseja excluir somente esta ou todas as futuras?`,
      variant: 'danger',
      actions: [
        { label: 'Excluir somente esta', value: 'single', variant: 'secondary' },
        { label: 'Excluir esta e todas futuras', value: 'future', variant: 'danger' }
      ]
    }
    showConfirm.value = true
  } else {
    pendingAction.value = { type: 'delete', transaction }
    confirmConfig.value = {
      title: 'Excluir transação',
      message: `Tem certeza que deseja excluir "${transaction.description}"?`,
      variant: 'danger',
      actions: [
        { label: 'Excluir', value: 'single', variant: 'danger' }
      ]
    }
    showConfirm.value = true
  }
}

async function handleSubmit(data) {
  if (editing.value && editingTransaction.value) {
    if (editingTransaction.value.fixed) {
      pendingAction.value = { type: 'edit', id: editingTransaction.value.id, data }
      confirmConfig.value = {
        title: 'Editar transação fixa',
        message: `"${editingTransaction.value.description}" é uma transação fixa. Aplicar a edição em quais ocorrências?`,
        variant: 'info',
        actions: [
          { label: 'Somente nesta', value: 'single', variant: 'secondary' },
          { label: 'Nesta e em todas futuras', value: 'future', variant: 'primary' }
        ]
      }
      closeModal()
      showConfirm.value = true
      return
    } else {
      await transactionsStore.updateTransaction(editingTransaction.value.id, data)
    }
  } else {
    await transactionsStore.createTransaction(data)
  }
  closeModal()
  fetchData()
}

async function handleConfirmAction(value) {
  const action = pendingAction.value
  if (!action) return

  if (action.type === 'delete') {
    if (value === 'single') {
      await transactionsStore.deleteTransaction(action.transaction.id)
    } else if (value === 'future') {
      await transactionsStore.deleteTransactionFuture(action.transaction.id)
    }
  } else if (action.type === 'edit') {
    if (value === 'single') {
      await transactionsStore.updateTransaction(action.id, action.data)
    } else if (value === 'future') {
      await transactionsStore.updateTransactionFuture(action.id, action.data)
    }
  }

  pendingAction.value = null
  fetchData()
}

function closeModal() {
  showModal.value = false
  editing.value = false
  editingTransaction.value = null
}

watch(competence, fetchData)
onMounted(() => {
  fetchData()
  accountsStore.fetchAccounts()
  categoriesStore.fetchCategories()
  creditCardsStore.fetchCards()
})
</script>

<style scoped>
.view {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.view__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: var(--space-4);
}

.view__title {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
}

.view__subtitle {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-top: var(--space-1);
}

.view__actions {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.view__competence {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.view__month {
  font-size: var(--text-md);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  min-width: 100px;
  text-align: center;
}
</style>
