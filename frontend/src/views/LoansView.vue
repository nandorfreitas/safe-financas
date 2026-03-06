<template>
  <div class="view">
    <div class="view__header">
      <div>
        <h1 class="view__title">Empréstimos e Financiamentos</h1>
        <p class="view__subtitle">Controle de empréstimos concedidos, financiamentos e dívidas</p>
      </div>
      <BaseButton @click="openModal()">Novo Contrato</BaseButton>
    </div>

    <!-- Summary Widgets -->
    <div class="summary-row">
      <div class="summary-widget summary-widget--success">
        <div class="summary-widget__icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
        </div>
        <div class="summary-widget__content">
          <span class="summary-widget__label">A Receber (Empréstimos)</span>
          <span class="summary-widget__value">{{ formatCurrency(totalReceivable) }}</span>
        </div>
      </div>
      <div class="summary-widget summary-widget--danger">
        <div class="summary-widget__icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
        </div>
        <div class="summary-widget__content">
          <span class="summary-widget__label">A Pagar (Financiamentos)</span>
          <span class="summary-widget__value">{{ formatCurrency(totalPayable) }}</span>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div v-if="loading" class="loading-state">Carregando dados...</div>
    <div v-else-if="error" class="error-state">{{ error }}</div>
    <div v-else class="loans-content">

      <!-- Empréstimos -->
      <section class="section">
        <div class="section__header">
          <h2 class="section__title">
            <span class="section__dot section__dot--success"></span>
            Meus Empréstimos (A Receber)
          </h2>
          <span class="section__count">{{ receivables.length }} contrato{{ receivables.length !== 1 ? 's' : '' }}</span>
        </div>
        <div v-if="receivables.length === 0" class="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="empty-state__icon"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
          <p>Nenhum empréstimo registrado</p>
          <span>Clique em "Novo Contrato" para começar</span>
        </div>
        <div v-else class="cards-grid">
          <div v-for="loan in receivables" :key="loan.id" :class="['loan-card', { 'loan-card--settled': loan.status === 'quitado' }]">
            <div class="loan-card__accent loan-card__accent--success"></div>
            <div class="loan-card__header">
              <h4 class="loan-card__title">{{ loan.title }}</h4>
              <BaseBadge :variant="loan.status === 'ativo' ? 'success' : 'secondary'">
                {{ loan.status === 'ativo' ? 'Ativo' : 'Quitado' }}
              </BaseBadge>
            </div>
            <div class="loan-card__body">
              <div class="loan-card__highlight">
                <span class="loan-card__highlight-label">Falta receber</span>
                <span class="loan-card__highlight-value loan-card__highlight-value--success">{{ formatCurrency(loan.remaining_balance) }}</span>
              </div>
              <div class="loan-card__details">
                <div class="loan-card__detail">
                  <span>Valor original</span>
                  <span>{{ formatCurrency(loan.total_amount) }}</span>
                </div>
                <div class="loan-card__detail">
                  <span>Prestação</span>
                  <span>{{ formatCurrency(loan.installment_value) }}</span>
                </div>
              </div>
              <div class="loan-card__progress">
                <div class="loan-card__progress-header">
                  <span>Parcelas</span>
                  <span>{{ loan.paid_installments }} / {{ loan.total_installments }}</span>
                </div>
                <div class="loan-card__progress-bar">
                  <div class="loan-card__progress-fill loan-card__progress-fill--success" :style="{ width: `${(loan.paid_installments / loan.total_installments) * 100}%` }"></div>
                </div>
              </div>
              <div v-if="loan.category_name" class="loan-card__category">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                <span>{{ loan.category_name }}</span>
              </div>
            </div>
            <div class="loan-card__actions">
              <button class="loan-card__action" @click="openModal(loan)" title="Editar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="loan-card__action loan-card__action--danger" @click="confirmDelete(loan.id)" title="Excluir">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Financiamentos -->
      <section class="section">
        <div class="section__header">
          <h2 class="section__title">
            <span class="section__dot section__dot--danger"></span>
            Meus Financiamentos & Dívidas (A Pagar)
          </h2>
          <span class="section__count">{{ payables.length }} contrato{{ payables.length !== 1 ? 's' : '' }}</span>
        </div>
        <div v-if="payables.length === 0" class="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="empty-state__icon"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
          <p>Nenhum financiamento registrado</p>
          <span>Clique em "Novo Contrato" para começar</span>
        </div>
        <div v-else class="cards-grid">
          <div v-for="loan in payables" :key="loan.id" :class="['loan-card', { 'loan-card--settled': loan.status === 'quitado' }]">
            <div class="loan-card__accent loan-card__accent--danger"></div>
            <div class="loan-card__header">
              <h4 class="loan-card__title">{{ loan.title }}</h4>
              <BaseBadge :variant="loan.status === 'ativo' ? 'danger' : 'secondary'">
                {{ loan.status === 'ativo' ? 'Ativo' : 'Quitado' }}
              </BaseBadge>
            </div>
            <div class="loan-card__body">
              <div class="loan-card__highlight">
                <span class="loan-card__highlight-label">Falta pagar</span>
                <span class="loan-card__highlight-value loan-card__highlight-value--danger">{{ formatCurrency(loan.remaining_balance) }}</span>
              </div>
              <div class="loan-card__details">
                <div class="loan-card__detail">
                  <span>Valor original</span>
                  <span>{{ formatCurrency(loan.total_amount) }}</span>
                </div>
                <div class="loan-card__detail">
                  <span>Prestação</span>
                  <span>{{ formatCurrency(loan.installment_value) }}</span>
                </div>
              </div>
              <div class="loan-card__progress">
                <div class="loan-card__progress-header">
                  <span>Parcelas</span>
                  <span>{{ loan.paid_installments }} / {{ loan.total_installments }}</span>
                </div>
                <div class="loan-card__progress-bar">
                  <div class="loan-card__progress-fill loan-card__progress-fill--danger" :style="{ width: `${(loan.paid_installments / loan.total_installments) * 100}%` }"></div>
                </div>
              </div>
              <div v-if="loan.category_name" class="loan-card__category">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                <span>{{ loan.category_name }}</span>
              </div>
            </div>
            <div class="loan-card__actions">
              <button class="loan-card__action" @click="openModal(loan)" title="Editar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="loan-card__action loan-card__action--danger" @click="confirmDelete(loan.id)" title="Excluir">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>

    <!-- Create/Edit Modal -->
    <BaseModal v-model="isModalOpen" :title="editingLoan ? 'Editar Contrato' : 'Novo Contrato'">
      <form class="loan-form" @submit.prevent="saveLoan">
        <BaseInput v-model="form.title" label="Título (ex: Financiamento Carro)" required />
        <BaseSelect v-model="form.type" label="Tipo" :options="typeOptions" required />

        <div class="form-row">
          <BaseInput v-model="form.installment_value" label="Valor da Prestação" type="number" step="0.01" min="0" required />
          <BaseInput v-model="form.total_installments" label="Total de Parcelas" type="number" min="1" required />
        </div>

        <BaseInput v-model="form.total_amount" label="Valor Original" type="number" step="0.01" min="0" required />

        <div v-if="editingLoan" class="form-row">
          <BaseInput v-model="form.paid_installments" label="Parcelas Pagas" type="number" min="0" :max="form.total_installments" />
        </div>

        <div v-if="editingLoan" class="form-row">
            <BaseInput v-model="form.remaining_balance" label="Saldo Devedor" type="number" step="0.01" min="0" />
            <BaseSelect v-model="form.status" label="Status" :options="statusOptions" />
        </div>
        
        <BaseSelect 
          v-model="form.linked_category_id" 
          label="Categoria Vinculada (Automação)" 
          :options="categoryOptions" 
          placeholder="Nenhuma (Não atualizar via transação)" 
          hint="Sempre que você criar uma transação PAGA nesta categoria, o saldo e as parcelas deste contrato serão atualizados."
        />

        <div class="form-actions">
          <BaseButton variant="secondary" @click="closeModal" type="button">Cancelar</BaseButton>
          <BaseButton type="submit" :loading="loading">Salvar</BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useLoansStore } from '@/stores/loans'
import { useCategoriesStore } from '@/stores/categories'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const loansStore = useLoansStore()
const categoriesStore = useCategoriesStore()

const { receivables, payables, totalReceivable, totalPayable, loading, error } = storeToRefs(loansStore)

const isModalOpen = ref(false)
const editingLoan = ref(null)

const typeOptions = [
  { value: 'emprestimo_concedido', label: 'Empréstimo (A Receber)' },
  { value: 'financiamento', label: 'Financiamento/Dívida (A Pagar)' }
]

const statusOptions = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'quitado', label: 'Quitado' }
]

const form = ref({
  title: '',
  type: 'financiamento',
  total_amount: 0,
  total_installments: 1,
  paid_installments: 0,
  remaining_balance: 0,
  linked_category_id: '',
  status: 'ativo',
  installment_value: 0
})

const categoryOptions = computed(() => {
    return [
       { value: '', label: 'Nenhuma (Manual)' },
       ...categoriesStore.groupedOptions
    ]
})

onMounted(async () => {
  await loansStore.fetchLoans()
  if (categoriesStore.categories.length === 0) {
      await categoriesStore.fetchCategories()
  }
})

function openModal(loan = null) {
  editingLoan.value = loan
  if (loan) {
    form.value = { 
        ...loan,
        linked_category_id: loan.linked_category_id || ''
    }
  } else {
    form.value = {
      title: '',
      type: 'financiamento',
      total_amount: 0,
      total_installments: 1,
      paid_installments: 0,
      remaining_balance: 0,
      linked_category_id: '',
      status: 'ativo',
      installment_value: 0
    }
  }
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
  editingLoan.value = null
}

async function saveLoan() {
  const payload = {
    ...form.value,
    total_amount: parseFloat(form.value.total_amount) || 0,
    remaining_balance: parseFloat(form.value.remaining_balance) || 0,
    total_installments: parseInt(form.value.total_installments) || 1,
    paid_installments: parseInt(form.value.paid_installments) || 0,
    linked_category_id: form.value.linked_category_id ? parseInt(form.value.linked_category_id) : null,
    installment_value: parseFloat(form.value.installment_value) || 0
  }

  try {
    if (editingLoan.value) {
      await loansStore.updateLoan(editingLoan.value.id, payload)
    } else {
      await loansStore.createLoan(payload)
    }
    closeModal()
  } catch (e) {
    // Handled by store
  }
}

async function confirmDelete(id) {
  if (confirm('Tem certeza que deseja excluir este contrato?')) {
    await loansStore.deleteLoan(id)
  }
}
</script>

<style scoped>
/* === Layout === */
.view { display: flex; flex-direction: column; gap: var(--space-6); }
.view__header { display: flex; justify-content: space-between; align-items: flex-start; }
.view__title { font-size: var(--text-2xl); font-weight: var(--font-bold); color: var(--text-primary); }
.view__subtitle { font-size: var(--text-sm); color: var(--text-secondary); margin-top: var(--space-1); }

/* === Summary Widgets === */
.summary-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-4);
}

.summary-widget {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-5) var(--space-6);
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--card-shadow);
  transition: transform var(--duration-normal) var(--easing-default),
              box-shadow var(--duration-normal) var(--easing-default);
}

.summary-widget:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.summary-widget__icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.summary-widget--success .summary-widget__icon {
  background: var(--color-success-subtle);
  color: var(--color-success);
}

.summary-widget--danger .summary-widget__icon {
  background: var(--color-danger-subtle);
  color: var(--color-danger);
}

.summary-widget__content {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.summary-widget__label {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.summary-widget__value {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
}

.summary-widget--success .summary-widget__value { color: var(--color-success); }
.summary-widget--danger .summary-widget__value { color: var(--color-danger); }

/* === Sections === */
.section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.section__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--border-subtle);
}

.section__title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-md);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.section__dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

.section__dot--success { background: var(--color-success); }
.section__dot--danger { background: var(--color-danger); }

.section__count {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  font-weight: var(--font-medium);
}

/* === Empty State === */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-10) var(--space-6);
  background: var(--card-bg);
  border: 1px dashed var(--border-default);
  border-radius: var(--radius-xl);
  text-align: center;
}

.empty-state__icon {
  color: var(--text-tertiary);
  margin-bottom: var(--space-2);
}

.empty-state p {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
}

.empty-state span {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

/* === Loading / Error === */
.loading-state, .error-state {
  padding: var(--space-10);
  text-align: center;
  color: var(--text-secondary);
  font-size: var(--text-sm);
}

/* === Cards Grid === */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-4);
}

/* === Loan Card === */
.loan-card {
  position: relative;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--card-shadow);
  overflow: hidden;
  transition: transform var(--duration-normal) var(--easing-default),
              box-shadow var(--duration-normal) var(--easing-default);
}

.loan-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.loan-card--settled {
  opacity: 0.65;
}

.loan-card__accent {
  height: 3px;
  width: 100%;
}

.loan-card__accent--success { background: linear-gradient(90deg, var(--color-primary-400), var(--color-primary-600)); }
.loan-card__accent--danger { background: linear-gradient(90deg, var(--color-danger-400), var(--color-danger-600)); }

.loan-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) var(--space-5);
  padding-right: 80px;
}

.loan-card__title {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.loan-card__body {
  padding: 0 var(--space-5) var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.loan-card__highlight {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.loan-card__highlight-label {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.loan-card__highlight-value {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
}

.loan-card__highlight-value--success { color: var(--color-success); }
.loan-card__highlight-value--danger { color: var(--color-danger); }

.loan-card__details {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--bg-muted);
  border-radius: var(--radius-md);
}

.loan-card__detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--text-xs);
}

.loan-card__detail span:first-child {
  color: var(--text-secondary);
}

.loan-card__detail span:last-child {
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.loan-card__progress {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.loan-card__progress-header {
  display: flex;
  justify-content: space-between;
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.loan-card__progress-header span:last-child {
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.loan-card__progress-bar {
  height: 6px;
  background: var(--bg-subtle);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.loan-card__progress-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.5s var(--easing-default);
  min-width: 2px;
}

.loan-card__progress-fill--success { background: linear-gradient(90deg, var(--color-primary-400), var(--color-primary-500)); }
.loan-card__progress-fill--danger { background: linear-gradient(90deg, var(--color-danger-400), var(--color-danger-500)); }

.loan-card__category {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  padding-top: var(--space-3);
  border-top: 1px solid var(--border-subtle);
}

/* === Card Actions === */
.loan-card__actions {
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
  display: flex;
  gap: var(--space-1);
  opacity: 0;
  transition: opacity var(--duration-normal) var(--easing-default);
}

.loan-card:hover .loan-card__actions {
  opacity: 1;
}

.loan-card__action {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: var(--bg-muted);
  color: var(--text-secondary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--duration-normal) var(--easing-default);
}

.loan-card__action:hover {
  background: var(--bg-subtle);
  color: var(--text-primary);
}

.loan-card__action--danger:hover {
  background: var(--color-danger-subtle);
  color: var(--color-danger);
}

/* === Form === */
.loan-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border-subtle);
}

/* === Responsive === */
@media (max-width: 768px) {
  .view__header { flex-direction: column; gap: var(--space-3); }
  .form-row { grid-template-columns: 1fr; }
  .cards-grid { grid-template-columns: 1fr; }
  .summary-row { grid-template-columns: 1fr; }
}
</style>
