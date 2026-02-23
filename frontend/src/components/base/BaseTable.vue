<template>
  <div class="base-table-wrapper">
    <table class="base-table">
      <thead>
        <tr>
          <th v-for="col in columns" :key="col.key" :style="col.width ? { width: col.width } : {}">
            {{ col.label }}
          </th>
          <th v-if="$slots.actions" style="width: 80px"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="data.length === 0">
          <td :colspan="columns.length + ($slots.actions ? 1 : 0)" class="base-table__empty">
            {{ emptyText }}
          </td>
        </tr>
        <tr v-for="(row, index) in data" :key="row.id || index">
          <td v-for="col in columns" :key="col.key">
            <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
              {{ formatCell(row[col.key], col) }}
            </slot>
          </td>
          <td v-if="$slots.actions" class="base-table__actions">
            <slot name="actions" :row="row" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
const props = defineProps({
  columns: { type: Array, required: true },
  data: { type: Array, default: () => [] },
  emptyText: { type: String, default: 'Nenhum registro encontrado' }
})

function formatCell(value, col) {
  if (value === null || value === undefined) return '—'
  if (col.format === 'currency') {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }
  if (col.format === 'date') {
    return value
  }
  return value
}
</script>

<style scoped>
.base-table-wrapper {
  overflow-x: auto;
  border-radius: var(--radius-lg);
  border: 1px solid var(--table-border);
}

.base-table {
  width: 100%;
  border-collapse: collapse;
}

.base-table thead th {
  padding: var(--space-3) var(--space-4);
  text-align: left;
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--table-header-text);
  background: var(--table-header-bg);
  border-bottom: 1px solid var(--table-border);
  white-space: nowrap;
}

.base-table tbody td {
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-sm);
  color: var(--text-primary);
  border-bottom: 1px solid var(--table-border);
}

.base-table tbody tr:last-child td {
  border-bottom: none;
}

.base-table tbody tr:hover {
  background: var(--table-row-hover);
}

.base-table__empty {
  text-align: center;
  color: var(--text-tertiary);
  padding: var(--space-10) var(--space-4) !important;
}

.base-table__actions {
  text-align: right;
  white-space: nowrap;
}
</style>
