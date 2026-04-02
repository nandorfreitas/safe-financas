<template>
  <div class="view">
    <header class="view__header">
      <div>
        <h1 class="view__title">Importar Transações</h1>
        <p class="view__subtitle">Importe extratos bancários (OFX) ou faturas de cartão (CSV)</p>
      </div>
      <div class="steps-indicator">
        <span :class="['step-dot', { active: store.step >= 1, current: store.step === 1 }]">1. Arquivo</span>
        <span v-if="store.format === 'csv'" :class="['step-dot', { active: store.step >= 2, current: store.step === 2 }]">2. Colunas</span>
        <span :class="['step-dot', { active: store.step >= 3, current: store.step === 3 }]">{{ store.format === 'csv' ? '3' : '2' }}. Revisar</span>
      </div>
    </header>

    <!-- Step 1: Upload -->
    <div v-if="store.step === 1" class="step-content">
      <div class="form-card">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Tipo de importação</label>
            <select class="form-control" v-model="store.context">
              <option value="account">Extrato bancário</option>
              <option value="credit_card">Fatura de cartão</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">{{ store.context === 'account' ? 'Conta' : 'Cartão de crédito' }}</label>
            <select class="form-control" v-model="store.targetId">
              <option :value="null" disabled>Selecione...</option>
              <option v-for="item in targetOptions" :key="item.id" :value="item.id">{{ item.name }}</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Formato do arquivo</label>
            <select class="form-control" v-model="store.format">
              <option value="ofx">OFX (extrato bancário)</option>
              <option value="csv">CSV</option>
            </select>
          </div>

          <div v-if="store.context === 'credit_card'" class="form-group">
            <label class="form-label">Competência da fatura</label>
            <input class="form-control" type="month" v-model="store.competence" />
          </div>
        </div>

        <div class="upload-area" @click="fileInput?.click()" @dragover.prevent @drop.prevent="handleDrop">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <p v-if="!fileName">Clique ou arraste o arquivo aqui</p>
          <p v-else class="file-name">{{ fileName }}</p>
          <span class="upload-hint">{{ store.format === 'ofx' ? 'Arquivos .ofx ou .qfx' : 'Arquivos .csv' }}</span>
          <input
            ref="fileInput"
            type="file"
            :accept="store.format === 'ofx' ? '.ofx,.qfx' : '.csv'"
            style="display: none"
            @change="handleFileSelect"
          />
        </div>

        <div v-if="store.error" class="error-message">{{ store.error }}</div>

        <div class="form-actions">
          <BaseButton
            variant="primary"
            :disabled="!canProceed || store.loading"
            @click="processFile"
          >
            {{ store.loading ? 'Processando...' : 'Processar arquivo' }}
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Step 2: CSV Column Mapping -->
    <div v-if="store.step === 2 && store.csvPreview" class="step-content">
      <div class="form-card">
        <h2 class="section-title">Mapeamento de colunas</h2>
        <p class="section-subtitle">Indique qual coluna corresponde a cada campo</p>

        <div class="mapping-grid">
          <div class="form-group">
            <label class="form-label">Data *</label>
            <select class="form-control" v-model.number="store.columnMapping.col_date">
              <option v-for="(header, i) in store.csvPreview.headers" :key="i" :value="i">{{ header || `Coluna ${i + 1}` }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Descrição *</label>
            <select class="form-control" v-model.number="store.columnMapping.col_description">
              <option v-for="(header, i) in store.csvPreview.headers" :key="i" :value="i">{{ header || `Coluna ${i + 1}` }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Valor *</label>
            <select class="form-control" v-model.number="store.columnMapping.col_amount">
              <option v-for="(header, i) in store.csvPreview.headers" :key="i" :value="i">{{ header || `Coluna ${i + 1}` }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Tipo (opcional)</label>
            <select class="form-control" v-model="store.columnMapping.col_type">
              <option :value="null">Inferir pelo valor</option>
              <option v-for="(header, i) in store.csvPreview.headers" :key="i" :value="i">{{ header || `Coluna ${i + 1}` }}</option>
            </select>
          </div>
        </div>

        <h3 class="section-title" style="margin-top: var(--space-4)">Preview ({{ store.csvPreview.totalLines }} linhas)</h3>
        <div class="csv-preview-wrapper">
          <table class="csv-preview-table">
            <thead>
              <tr>
                <th v-for="(header, i) in store.csvPreview.headers" :key="i">{{ header || `Col ${i + 1}` }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, ri) in store.csvPreview.sampleRows" :key="ri">
                <td v-for="(cell, ci) in row" :key="ci">{{ cell }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="store.error" class="error-message">{{ store.error }}</div>

        <div class="form-actions">
          <BaseButton variant="ghost" @click="store.step = 1">Voltar</BaseButton>
          <BaseButton variant="primary" :disabled="store.loading" @click="processFile">
            {{ store.loading ? 'Processando...' : 'Processar' }}
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Step 3: Preview and Confirm -->
    <div v-if="store.step === 3" class="step-content">
      <ImportPreviewTable
        :transactions="store.parsedTransactions"
        :selected-ids="store.selectedIds"
        :summary="store.summary"
        :selected-summary="store.selectedSummary"
        :categories="categoriesStore.categories"
        @toggle="store.toggleSelection"
        @select-all="store.selectAll"
        @deselect-all="store.deselectAll"
        @update="store.updateTransaction"
        @set-category-bulk="store.setCategoryBulk"
      />

      <div v-if="store.error" class="error-message">{{ store.error }}</div>

      <div class="form-actions">
        <BaseButton variant="ghost" @click="store.step = 1">Voltar</BaseButton>
        <BaseButton
          variant="primary"
          :disabled="store.selectedSummary.count === 0 || store.loading"
          @click="confirmImport"
        >
          {{ store.loading ? 'Importando...' : `Importar ${store.selectedSummary.count} transações` }}
        </BaseButton>
      </div>
    </div>

    <!-- Success state -->
    <div v-if="importResult" class="step-content">
      <div class="success-card">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <h2>Importação concluída!</h2>
        <p>{{ importResult.created }} transações importadas com sucesso.</p>
        <div class="form-actions">
          <BaseButton variant="ghost" @click="startNew">Nova importação</BaseButton>
          <BaseButton variant="primary" @click="$router.push('/transactions')">Ver transações</BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import BaseButton from '@/components/base/BaseButton.vue'
import ImportPreviewTable from '@/components/financial/ImportPreviewTable.vue'
import { useImportStore } from '@/stores/import'
import { useAccountsStore } from '@/stores/accounts'
import { useCreditCardsStore } from '@/stores/creditCards'
import { useCategoriesStore } from '@/stores/categories'

const store = useImportStore()
const accountsStore = useAccountsStore()
const creditCardsStore = useCreditCardsStore()
const categoriesStore = useCategoriesStore()

const fileInput = ref(null)
const fileName = ref('')
const importResult = ref(null)

const targetOptions = computed(() => {
  if (store.context === 'account') {
    return accountsStore.accounts.filter(a => a.active)
  }
  return creditCardsStore.cards.filter(c => c.active)
})

const canProceed = computed(() =>
  store.targetId && store.fileBuffer &&
  (store.context !== 'credit_card' || store.competence)
)

onMounted(async () => {
  store.reset()
  await Promise.all([
    accountsStore.fetchAccounts(),
    creditCardsStore.fetchCards(),
    categoriesStore.fetchCategories()
  ])
})

function handleFileSelect(event) {
  const file = event.target.files?.[0]
  if (!file) return
  readFile(file)
}

function handleDrop(event) {
  const file = event.dataTransfer?.files?.[0]
  if (!file) return
  readFile(file)
}

async function readFile(file) {
  fileName.value = file.name
  const buffer = await file.arrayBuffer()
  store.fileBuffer = buffer
  store.error = null
}

async function processFile() {
  importResult.value = null
  await store.parseFile()
}

async function confirmImport() {
  try {
    const result = await store.confirmImport()
    importResult.value = result
    store.step = 0 // Hide wizard steps
  } catch {
    // Error already set in store
  }
}

function startNew() {
  importResult.value = null
  store.reset()
  fileName.value = ''
  if (fileInput.value) fileInput.value.value = ''
}
</script>

<style scoped>
.view {
  padding: var(--space-6);
  max-width: 1200px;
}

.view__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--space-6);
  flex-wrap: wrap;
  gap: var(--space-4);
}

.view__title {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
}

.view__subtitle {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-top: var(--space-1);
}

.steps-indicator {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}

.step-dot {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  background: var(--bg-secondary);
  transition: all var(--duration-normal);
}

.step-dot.active {
  color: var(--text-secondary);
}

.step-dot.current {
  background: var(--btn-primary-bg);
  color: white;
  font-weight: var(--font-medium);
}

.step-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.form-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--space-4);
}

.mapping-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-4);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.form-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
}

.form-control {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: var(--text-sm);
}

.form-control:focus {
  outline: none;
  border-color: var(--btn-primary-bg);
  box-shadow: 0 0 0 2px var(--btn-primary-bg-subtle, rgba(99, 102, 241, 0.15));
}

.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-8) var(--space-4);
  border: 2px dashed var(--border-default);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--duration-normal);
  color: var(--text-secondary);
}

.upload-area:hover {
  border-color: var(--btn-primary-bg);
  background: var(--bg-hover);
}

.upload-area p {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

.upload-hint {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.file-name {
  color: var(--btn-primary-bg) !important;
}

.section-title {
  font-size: var(--text-md);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.section-subtitle {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-top: calc(var(--space-1) * -1);
}

.csv-preview-wrapper {
  overflow-x: auto;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
}

.csv-preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

.csv-preview-table th {
  padding: var(--space-2) var(--space-3);
  background: var(--bg-secondary);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  text-align: left;
  font-size: var(--text-xs);
  border-bottom: 1px solid var(--border-subtle);
}

.csv-preview-table td {
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-primary);
}

.form-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
  padding-top: var(--space-2);
}

.error-message {
  padding: var(--space-3) var(--space-4);
  background: var(--color-danger-subtle);
  color: var(--color-danger);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
}

.success-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-10) var(--space-6);
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  text-align: center;
}

.success-card h2 {
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--text-primary);
}

.success-card p {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}
</style>
