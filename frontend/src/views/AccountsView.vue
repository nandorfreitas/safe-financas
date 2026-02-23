<template>
  <div class="view">
    <div class="view__header">
      <div>
        <h1 class="view__title">Contas</h1>
        <p class="view__subtitle">Gerenciar contas bancárias e carteiras</p>
      </div>
      <BaseButton @click="showModal = true">Nova Conta</BaseButton>
    </div>

    <div class="cards-grid">
      <AccountCard
        v-for="account in accountsStore.balances"
        :key="account.id"
        :account="account"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </div>

    <p v-if="!accountsStore.balances.length && !accountsStore.loading" class="empty-state">
      Nenhuma conta cadastrada. Crie sua primeira conta.
    </p>

    <BaseModal v-model="showModal" :title="editing ? 'Editar Conta' : 'Nova Conta'">
      <form @submit.prevent="handleSubmit" class="form">
        <BaseInput v-model="form.name" label="Nome" placeholder="Ex: Nubank" />
        <BaseSelect v-model="form.type" label="Tipo" :options="typeOptions" />
        <BaseInput v-model="form.initial_balance" label="Saldo Inicial" type="number" step="0.01" placeholder="0,00" />
        <BaseCheckbox v-model="form.active" label="Ativa" />
        <div class="form__actions">
          <BaseButton variant="secondary" @click="closeModal">Cancelar</BaseButton>
          <BaseButton type="submit">{{ editing ? 'Salvar' : 'Criar' }}</BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseCheckbox from '@/components/base/BaseCheckbox.vue'
import AccountCard from '@/components/financial/AccountCard.vue'
import { useAccountsStore } from '@/stores/accounts'

const accountsStore = useAccountsStore()

const showModal = ref(false)
const editing = ref(false)
const editingId = ref(null)

const form = reactive({ name: '', type: 'corrente', initial_balance: 0, active: true })

const typeOptions = [
  { value: 'corrente', label: 'Corrente' },
  { value: 'poupanca', label: 'Poupança' },
  { value: 'investimento', label: 'Investimento' },
  { value: 'carteira', label: 'Carteira' }
]

function handleEdit(account) {
  editing.value = true
  editingId.value = account.id
  Object.assign(form, { name: account.name, type: account.type, initial_balance: account.initial_balance, active: !!account.active })
  showModal.value = true
}

function handleDelete(account) {
  if (confirm('Excluir esta conta?')) {
    accountsStore.deleteAccount(account.id).then(() => accountsStore.fetchBalances())
  }
}

async function handleSubmit() {
  const payload = { ...form, active: form.active ? 1 : 0, initial_balance: parseFloat(form.initial_balance) || 0 }
  if (editing.value) {
    await accountsStore.updateAccount(editingId.value, payload)
  } else {
    await accountsStore.createAccount(payload)
  }
  closeModal()
  accountsStore.fetchBalances()
}

function closeModal() {
  showModal.value = false
  editing.value = false
  editingId.value = null
  Object.assign(form, { name: '', type: 'corrente', initial_balance: 0, active: true })
}

onMounted(() => accountsStore.fetchBalances())
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
