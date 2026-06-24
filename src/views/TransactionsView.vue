<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import {
  OrenPage,
  OrenButton,
  OrenTable,
  OrenBadge,
  OrenModal,
  OrenInput,
  OrenSelect,
  OrenToggle,
  useToast,
} from "@oren/design-system";
import type { Column, SelectOption } from "@oren/design-system";
import MoneyInput from "@/components/MoneyInput.vue";
import { useAccounts, useCategories, useTransactionsMonth } from "@/composables/useData";
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "@/services/transactions";
import { useWorkspaceStore } from "@/stores/workspace";
import { formatBRL } from "@/lib/money";
import { competenciaDe, competenciaLabel, addMeses } from "@/lib/competencia";
import type { Transaction, TipoTransacao } from "@/types/models";

const toast = useToast();
const wsStore = useWorkspaceStore();

const competencia = ref(competenciaDe());
const txs = useTransactionsMonth(competencia);
const accounts = useAccounts();
const categories = useCategories();

const contas = computed(() =>
  accounts.value.filter((a) => a.tipo === "conta" && !a.arquivada),
);

function nomeConta(id?: string) {
  return id ? accounts.value.find((a) => a.id === id)?.nome ?? "—" : "—";
}
function nomeCategoria(id?: string) {
  return id ? categories.value.find((c) => c.id === id)?.nome ?? "—" : "—";
}
function nomeAutor(uid: string) {
  return wsStore.active?.members[uid]?.nome ?? "—";
}

// ── Filtros ──
const filtroTipo = ref<"" | TipoTransacao>("");
const filtroStatus = ref<"" | "previsto" | "realizado">("");

const linhas = computed(() =>
  txs.value.filter((t) => {
    if (filtroTipo.value && t.tipo !== filtroTipo.value) return false;
    if (filtroStatus.value === "previsto" && !t.previsto) return false;
    if (filtroStatus.value === "realizado" && !t.realizado) return false;
    return true;
  }),
);

const columns: Column<Transaction>[] = [
  { key: "data", label: "Data" },
  { key: "descricao", label: "Descrição" },
  { key: "categoryId", label: "Categoria" },
  { key: "accountId", label: "Conta" },
  { key: "previsto", label: "Status" },
  { key: "valorPrevisto", label: "Previsto" },
  { key: "valor", label: "Efetivo" },
  { key: "criadoPor", label: "Autor" },
  { key: "id", label: "" },
];

// Valor previsto (com fallback ao efetivo, para lançamentos antigos).
function prev(t: Transaction): number {
  return t.valorPrevisto ?? t.valor;
}
// Desvio do efetivo sobre o previsto (só faz sentido se realizado).
function desvio(t: Transaction): number {
  return t.valor - prev(t);
}

const tipoFiltroOptions: SelectOption[] = [
  { label: "Todos os tipos", value: "" },
  { label: "Receitas", value: "receita" },
  { label: "Despesas", value: "despesa" },
];
const statusFiltroOptions: SelectOption[] = [
  { label: "Todos", value: "" },
  { label: "Previstos", value: "previsto" },
  { label: "Realizados", value: "realizado" },
];

function fmtData(ts: Transaction["data"]): string {
  try {
    return ts.toDate().toLocaleDateString("pt-BR");
  } catch {
    return "—";
  }
}

// ── Criar / editar ──
const modalOpen = ref(false);
const editingId = ref<string | null>(null);
const saving = ref(false);

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

const form = reactive({
  tipo: "despesa" as TipoTransacao,
  descricao: "",
  // Fluxo "previsão primeiro": o valor previsto é o principal; o efetivo é
  // preenchido depois, ao efetivar.
  valorPrevisto: 0,
  valorEfetivo: 0,
  dataISO: hojeISO(),
  accountId: "" as string,
  categoryId: "" as string,
  previsto: true,
  realizado: false,
  fixa: false,
});

// Opções de categoria conforme o tipo selecionado.
const categoriaOptions = computed<SelectOption[]>(() => [
  { label: "— sem categoria —", value: "" },
  ...categories.value
    .filter((c) => c.tipo === form.tipo && !c.arquivada)
    .map((c) => ({ label: c.nome, value: c.id ?? "" })),
]);

const contaOptions = computed<SelectOption[]>(() => [
  { label: "— sem conta —", value: "" },
  ...contas.value.map((a) => ({ label: a.nome, value: a.id ?? "" })),
]);

const tipoFormOptions: SelectOption[] = [
  { label: "Despesa", value: "despesa" },
  { label: "Receita", value: "receita" },
];

// Ao escolher categoria, herda o default de "fixa" (só despesa).
watch(
  () => form.categoryId,
  (id) => {
    if (form.tipo !== "despesa") return;
    const cat = categories.value.find((c) => c.id === id);
    if (cat) form.fixa = cat.fixaPorPadrao;
  },
);

function abrirNovo() {
  editingId.value = null;
  Object.assign(form, {
    tipo: "despesa",
    descricao: "",
    valorPrevisto: 0,
    valorEfetivo: 0,
    dataISO: hojeISO(),
    accountId: "",
    categoryId: "",
    previsto: true,
    realizado: false,
    fixa: false,
  });
  modalOpen.value = true;
}

function abrirEdicao(t: Transaction) {
  editingId.value = t.id ?? null;
  Object.assign(form, {
    tipo: t.tipo,
    descricao: t.descricao,
    valorPrevisto: t.valorPrevisto ?? t.valor,
    valorEfetivo: t.realizado ? t.valor : 0,
    dataISO: t.data.toDate().toISOString().slice(0, 10),
    accountId: t.accountId ?? "",
    categoryId: t.categoryId ?? "",
    previsto: t.previsto,
    realizado: t.realizado,
    fixa: t.fixa,
  });
  modalOpen.value = true;
}

async function salvar() {
  if (!form.descricao.trim()) {
    toast.error("Informe uma descrição.");
    return;
  }
  if (form.valorPrevisto <= 0) {
    toast.error("Informe o valor previsto.");
    return;
  }
  if (form.realizado && form.valorEfetivo <= 0) {
    toast.error("Para um lançamento já efetivado, informe o valor efetivo.");
    return;
  }
  if (!form.previsto && !form.realizado) {
    toast.error("O lançamento precisa ser previsto, efetivado, ou ambos.");
    return;
  }
  saving.value = true;
  try {
    const payload = {
      tipo: form.tipo,
      previsto: form.previsto,
      realizado: form.realizado,
      // valorPrevisto guarda a previsão; valor guarda o efetivo (ou espelha a
      // previsão enquanto não efetivado — o lado realizado só soma se realizado).
      valor: form.realizado ? form.valorEfetivo : form.valorPrevisto,
      valorPrevisto: form.valorPrevisto,
      data: new Date(form.dataISO + "T12:00:00"),
      accountId: form.accountId || undefined,
      categoryId: form.categoryId || undefined,
      fixa: form.tipo === "despesa" ? form.fixa : false,
      descricao: form.descricao.trim(),
    };
    if (editingId.value) {
      await updateTransaction(editingId.value, payload);
      toast.success("Lançamento atualizado.");
    } else {
      await createTransaction(payload);
      toast.success("Lançamento criado.");
    }
    modalOpen.value = false;
  } catch (e) {
    toast.error("Não foi possível salvar.");
    console.error(e);
  } finally {
    saving.value = false;
  }
}

async function remover(t: Transaction) {
  if (!t.id) return;
  if (!confirm("Excluir este lançamento?")) return;
  try {
    await deleteTransaction(t.id);
    toast.success("Lançamento excluído.");
  } catch (e) {
    toast.error("Não foi possível excluir.");
    console.error(e);
  }
}
</script>

<template>
  <OrenPage subtitle="Visão geral" title="Transações">
    <template #actions>
      <OrenButton variant="primary" @click="abrirNovo">Novo lançamento</OrenButton>
    </template>

    <div class="page-pad">
      <!-- Navegação de mês + filtros -->
      <div class="toolbar">
        <div class="month-nav">
          <OrenButton size="sm" variant="ghost" @click="competencia = addMeses(competencia, -1)">
            ‹
          </OrenButton>
          <span class="month-label">{{ competenciaLabel(competencia) }}</span>
          <OrenButton size="sm" variant="ghost" @click="competencia = addMeses(competencia, 1)">
            ›
          </OrenButton>
        </div>
        <div class="filters">
          <OrenSelect v-model="filtroTipo" :options="tipoFiltroOptions" />
          <OrenSelect v-model="filtroStatus" :options="statusFiltroOptions" />
        </div>
      </div>

      <p v-if="linhas.length === 0" class="empty">
        Nenhum lançamento neste mês com os filtros atuais.
      </p>

      <OrenTable v-else :columns="columns" :rows="linhas">
        <template #cell-data="{ row }">{{ fmtData(row.data) }}</template>
        <template #cell-categoryId="{ value }">{{ nomeCategoria(value as string) }}</template>
        <template #cell-accountId="{ value }">{{ nomeConta(value as string) }}</template>
        <template #cell-previsto="{ row }">
          <div class="status-badges">
            <OrenBadge v-if="row.previsto" variant="warning">Previsto</OrenBadge>
            <OrenBadge v-if="row.realizado" variant="success">Realizado</OrenBadge>
          </div>
        </template>
        <template #cell-valorPrevisto="{ row }">
          <span :class="row.tipo === 'receita' ? 'val-pos' : 'val-neg'">
            {{ row.tipo === "receita" ? "+" : "−" }}{{ formatBRL(prev(row)) }}
          </span>
        </template>
        <template #cell-valor="{ row }">
          <template v-if="row.realizado">
            <strong :class="row.tipo === 'receita' ? 'val-pos' : 'val-neg'">
              {{ row.tipo === "receita" ? "+" : "−" }}{{ formatBRL(row.valor) }}
            </strong>
            <span v-if="desvio(row) !== 0" class="prev-hint">
              desvio {{ desvio(row) > 0 ? "+" : "−" }}{{ formatBRL(Math.abs(desvio(row))) }}
            </span>
          </template>
          <span v-else class="prev-hint">— a efetivar</span>
        </template>
        <template #cell-criadoPor="{ value }">{{ nomeAutor(value as string) }}</template>
        <template #cell-id="{ row }">
          <div class="row-actions">
            <OrenButton size="sm" variant="ghost" @click="abrirEdicao(row)">Editar</OrenButton>
            <OrenButton size="sm" variant="danger" @click="remover(row)">Excluir</OrenButton>
          </div>
        </template>
      </OrenTable>
    </div>

    <!-- Modal de lançamento -->
    <OrenModal v-model="modalOpen" :title="editingId ? 'Editar lançamento' : 'Novo lançamento'">
      <div class="form">
        <OrenSelect v-model="form.tipo" label="Tipo" :options="tipoFormOptions" />
        <OrenInput v-model="form.descricao" label="Descrição" placeholder="Ex.: Conta de luz" />

        <!-- Previsão é o principal -->
        <MoneyInput v-model="form.valorPrevisto" label="Valor previsto (R$)" />

        <OrenSelect v-model="form.categoryId" label="Categoria" :options="categoriaOptions" />
        <OrenSelect v-model="form.accountId" label="Conta" :options="contaOptions" />

        <div class="flags">
          <OrenToggle v-model="form.previsto">Entra no previsto</OrenToggle>
          <OrenToggle v-model="form.realizado">Já foi efetivado</OrenToggle>
          <OrenToggle v-if="form.tipo === 'despesa'" v-model="form.fixa">
            Despesa fixa
          </OrenToggle>
        </div>

        <!-- Efetivo: só ao efetivar -->
        <template v-if="form.realizado">
          <MoneyInput v-model="form.valorEfetivo" label="Valor efetivo (R$)" />
        </template>

        <div class="field">
          <label>{{ form.realizado ? "Data de efetivação" : "Data prevista" }}</label>
          <input v-model="form.dataISO" type="date" class="date-input" />
        </div>
      </div>
      <template #footer="{ close }">
        <OrenButton variant="ghost" @click="close">Cancelar</OrenButton>
        <OrenButton variant="primary" :loading="saving" @click="salvar">Salvar</OrenButton>
      </template>
    </OrenModal>
  </OrenPage>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}
.month-nav {
  display: flex;
  align-items: center;
  gap: 8px;
}
.month-label {
  font-size: 16px;
  font-weight: 500;
  text-transform: capitalize;
  min-width: 160px;
  text-align: center;
}
.filters {
  display: flex;
  gap: 10px;
}
.empty {
  color: var(--text-muted);
  font-size: 14px;
}
.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 340px;
}
.field label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
}
.date-input {
  width: 100%;
  box-sizing: border-box;
  font-family: inherit;
  font-size: 15px;
  padding: 10px 13px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius);
  background: var(--surface-raised);
  color: var(--text-default);
}
.flags {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 4px;
}
.status-badges {
  display: flex;
  gap: 6px;
}
.row-actions {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}
.val-pos {
  color: var(--action-primary, #1f7a4d);
}
.val-neg {
  color: #b42318;
}
.prev-hint {
  display: block;
  font-size: 11px;
  color: var(--text-muted);
}
</style>
