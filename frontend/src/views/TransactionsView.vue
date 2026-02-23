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
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseModal from '@/components/base/BaseModal.vue'
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
  if (confirm('Excluir esta transação?')) {
    transactionsStore.deleteTransaction(transaction.id).then(fetchData)
  }
}

async function handleSubmit(data) {
  if (editing.value && editingTransaction.value) {
    await transactionsStore.updateTransaction(editingTransaction.value.id, data)
  } else {
    await transactionsStore.createTransaction(data)
  }
  closeModal()
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
