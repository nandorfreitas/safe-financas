<script setup lang="ts" generic="T extends object">
import type { Column } from "../types";

defineProps<{ columns: Column<T>[]; rows: T[] }>();
</script>

<template>
  <div class="oren-table-wrap">
    <table class="oren-table">
    <thead>
      <tr>
        <th v-for="col in columns" :key="col.key">{{ col.label }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(row, i) in rows" :key="i">
        <td v-for="col in columns" :key="col.key">
          <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
            {{ row[col.key] }}
          </slot>
        </td>
      </tr>
    </tbody>
    </table>
  </div>
</template>

<style scoped>
/* Rolagem horizontal em telas estreitas — a página nunca rola na horizontal. */
.oren-table-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.oren-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-family);
  font-size: 14px;
  background: var(--surface-raised);
  color: var(--text-default);
  border: 1px solid var(--border-default);
  border-radius: var(--radius);
  overflow: hidden;
}
.oren-table th,
.oren-table td {
  text-align: left;
  padding: 11px 14px;
  border-bottom: 1px solid var(--border-default);
}
.oren-table thead th {
  background: var(--surface-subtle);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}
.oren-table tbody tr:last-child td {
  border-bottom: none;
}
.oren-table tbody tr:hover {
  background: var(--surface-subtle);
}

/* No mobile a tabela assume a largura natural e rola dentro do wrapper,
   em vez de espremer as colunas. */
@media (max-width: 768px) {
  .oren-table {
    min-width: max-content;
  }
}
</style>
