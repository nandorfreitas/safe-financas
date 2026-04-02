<template>
  <div class="import-preview">
    <!-- Summary bar -->
    <div class="preview-summary">
      <div class="summary-item">
        <span class="summary-label">Selecionadas</span>
        <span class="summary-value">{{ selectedSummary.count }} / {{ transactions.length }}</span>
      </div>
      <div class="summary-item summary-item--success">
        <span class="summary-label">Receitas</span>
        <span class="summary-value">{{ formatCurrency(selectedSummary.receitas) }}</span>
      </div>
      <div class="summary-item summary-item--danger">
        <span class="summary-label">Despesas</span>
        <span class="summary-value">{{ formatCurrency(selectedSummary.despesas) }}</span>
      </div>
      <div v-if="summary?.duplicates_found > 0" class="summary-item summary-item--warning">
        <span class="summary-label">Duplicatas</span>
        <span class="summary-value">{{ summary.duplicates_found }}</span>
      </div>
    </div>

    <!-- Bulk actions -->
    <div class="preview-actions">
      <BaseButton variant="ghost" size="sm" @click="$emit('select-all')">Selecionar todas</BaseButton>
      <BaseButton variant="ghost" size="sm" @click="$emit('deselect-all')">Desmarcar todas</BaseButton>
      <div class="bulk-category">
        <select class="bulk-select" v-model="bulkCategoryId">
          <option :value="null">Aplicar categoria...</option>
          <optgroup v-for="group in categoryGroups" :key="group.label" :label="group.label">
            <option v-for="cat in group.items" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </optgroup>
        </select>
        <BaseButton v-if="bulkCategoryId" variant="secondary" size="sm" @click="applyBulkCategory">
          Aplicar
        </BaseButton>
      </div>
    </div>

    <!-- Table -->
    <div class="preview-table-wrapper">
      <table class="preview-table">
        <thead>
          <tr>
            <th class="col-check">
              <input type="checkbox" :checked="allSelected" @change="toggleAll" />
            </th>
            <th>Data</th>
            <th>Descrição</th>
            <th>Valor</th>
            <th>Tipo</th>
            <th>Categoria</th>
            <th class="col-status">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="t in transactions"
            :key="t.temp_id"
            :class="{ 'row--duplicate': t.is_duplicate, 'row--deselected': !selectedIds.has(t.temp_id) }"
          >
            <td class="col-check">
              <input
                type="checkbox"
                :checked="selectedIds.has(t.temp_id)"
                @change="$emit('toggle', t.temp_id)"
              />
            </td>
            <td class="col-date">{{ formatDate(t.date) }}</td>
            <td>
              <input
                class="inline-input"
                type="text"
                :value="t.description"
                @change="$emit('update', t.temp_id, { description: $event.target.value })"
              />
            </td>
            <td class="col-amount">
              <span :class="['amount', `amount--${t.type}`]">
                {{ t.type === 'receita' ? '+' : '-' }}{{ formatCurrency(t.amount) }}
              </span>
            </td>
            <td class="col-type">
              <button class="type-toggle" @click="toggleType(t)">
                <BaseBadge :variant="t.type === 'receita' ? 'success' : 'danger'">
                  {{ t.type === 'receita' ? 'Receita' : 'Despesa' }}
                </BaseBadge>
              </button>
            </td>
            <td class="col-category">
              <select
                class="inline-select"
                :value="t.category_id || ''"
                @change="$emit('update', t.temp_id, { category_id: $event.target.value ? parseInt($event.target.value) : null })"
              >
                <option value="">Sem categoria</option>
                <optgroup v-for="group in categoryGroups" :key="group.label" :label="group.label">
                  <option v-for="cat in group.items" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                </optgroup>
              </select>
            </td>
            <td class="col-status">
              <BaseBadge v-if="t.is_duplicate" variant="warning">Duplicata</BaseBadge>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseButton from '@/components/base/BaseButton.vue'

const props = defineProps({
  transactions: { type: Array, required: true },
  selectedIds: { type: Set, required: true },
  summary: { type: Object, default: null },
  selectedSummary: { type: Object, required: true },
  categories: { type: Array, default: () => [] }
})

const emit = defineEmits(['toggle', 'select-all', 'deselect-all', 'update', 'set-category-bulk'])

const bulkCategoryId = ref(null)

const allSelected = computed(() =>
  props.transactions.length > 0 && props.transactions.every(t => props.selectedIds.has(t.temp_id))
)

const categoryGroups = computed(() => {
  const parents = props.categories.filter(c => !c.parent_id)
  return parents.map(parent => {
    const children = props.categories.filter(c => c.parent_id === parent.id)
    return {
      label: parent.name,
      items: children.length > 0 ? children : [parent]
    }
  })
})

function toggleAll() {
  if (allSelected.value) {
    emit('deselect-all')
  } else {
    emit('select-all')
  }
}

function toggleType(t) {
  const newType = t.type === 'receita' ? 'despesa' : 'receita'
  emit('update', t.temp_id, { type: newType })
}

function applyBulkCategory() {
  if (bulkCategoryId.value) {
    emit('set-category-bulk', parseInt(bulkCategoryId.value))
    bulkCategoryId.value = null
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}
</script>

<style scoped>
.import-preview {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.preview-summary {
  display: flex;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-3) var(--space-4);
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
}

.summary-label {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.summary-value {
  font-size: var(--text-md);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.summary-item--success .summary-value { color: var(--color-success); }
.summary-item--danger .summary-value { color: var(--color-danger); }
.summary-item--warning .summary-value { color: var(--color-warning); }

.preview-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.bulk-category {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-left: auto;
}

.bulk-select,
.inline-select {
  padding: var(--space-1) var(--space-2);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: var(--text-sm);
}

.preview-table-wrapper {
  overflow-x: auto;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

.preview-table thead {
  background: var(--bg-secondary);
}

.preview-table th {
  padding: var(--space-2) var(--space-3);
  text-align: left;
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid var(--border-subtle);
}

.preview-table td {
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-primary);
  vertical-align: middle;
}

.preview-table tbody tr:hover {
  background: var(--bg-hover);
}

.row--duplicate {
  background: var(--color-warning-subtle);
}

.row--duplicate:hover {
  background: var(--color-warning-subtle);
}

.row--deselected {
  opacity: 0.5;
}

.col-check {
  width: 40px;
  text-align: center;
}

.col-date {
  white-space: nowrap;
  width: 100px;
}

.col-amount {
  white-space: nowrap;
  width: 130px;
}

.col-type {
  width: 100px;
}

.col-category {
  width: 180px;
}

.col-status {
  width: 100px;
}

.inline-input {
  width: 100%;
  padding: var(--space-1) var(--space-2);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-primary);
  font-size: var(--text-sm);
}

.inline-input:hover,
.inline-input:focus {
  border-color: var(--border-default);
  background: var(--bg-primary);
  outline: none;
}

.type-toggle {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.amount {
  font-weight: var(--font-semibold);
}

.amount--receita { color: var(--color-success); }
.amount--despesa { color: var(--color-danger); }
</style>
