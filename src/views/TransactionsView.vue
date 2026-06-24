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
} from "@/ui";
import type { Column, SelectOption } from "@/ui";
import MoneyInput from "@/components/MoneyInput.vue";
import { useRouter } from "vue-router";
import {
  useAccounts,
  useCategories,
  useTransactionsMonth,
  useInvoicesMonth,
} from "@/composables/useData";
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "@/services/transactions";
import { useWorkspaceStore } from "@/stores/workspace";
import { formatBRL } from "@/lib/money";
import {
  competenciaDe,
  competenciaLabel,
  addMeses,
  parseCompetencia,
} from "@/lib/competencia";
import type { Transaction, TipoTransacao } from "@/types/models";

const toast = useToast();
const router = useRouter();
const wsStore = useWorkspaceStore();

const competencia = ref(competenciaDe());
const txs = useTransactionsMonth(competencia);
const accounts = useAccounts();
const categories = useCategories();

// Mês anterior (para copiar fixas) e faturas do mês (cartão como despesa).
const prevComp = computed(() => addMeses(competencia.value, -1));
const txsPrev = useTransactionsMonth(prevComp);
// Faturas do mês (abertas e pagas) — o cartão é uma despesa, mesmo após pago.
const faturasMes = useInvoicesMonth(competencia);

// Contas fixas do mês anterior ainda não presentes neste mês (por descrição).
const fixasParaCopiar = computed(() => {
  const existentes = new Set(txs.value.map((t) => t.descricao.toLowerCase()));
  return txsPrev.value.filter(
    (t) =>
      t.tipo === "despesa" &&
      t.fixa &&
      !existentes.has(t.descricao.toLowerCase()),
  );
});

const copiando = ref(false);
async function copiarFixas() {
  if (fixasParaCopiar.value.length === 0) return;
  copiando.value = true;
  try {
    const { ano, mes } = parseCompetencia(competencia.value);
    const ultimoDia = new Date(ano, mes, 0).getDate();
    for (const t of fixasParaCopiar.value) {
      const dia = Math.min(t.data.toDate().getDate(), ultimoDia);
      await createTransaction({
        tipo: "despesa",
        previsto: true,
        realizado: false,
        valor: t.valorPrevisto ?? t.valor,
        valorPrevisto: t.valorPrevisto ?? t.valor,
        data: new Date(ano, mes - 1, dia, 12, 0, 0),
        accountId: t.accountId,
        categoryId: t.categoryId,
        fixa: true,
        essencial: t.essencial ?? false,
        descricao: t.descricao,
      });
    }
    toast.success(`${fixasParaCopiar.value.length} conta(s) fixa(s) copiada(s).`);
  } catch (e) {
    toast.error("Não foi possível copiar.");
    console.error(e);
  } finally {
    copiando.value = false;
  }
}

function fmtVenc(ms: number) {
  return ms ? new Date(ms).toLocaleDateString("pt-BR") : "—";
}

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
const filtroStatus = ref<"" | "previsto" | "realizado" | "pendente">("");

const linhas = computed(() =>
  txs.value.filter((t) => {
    // Compras de cartão não aparecem soltas aqui: o cartão entra como fatura
    // (despesa) e o detalhe fica na tela do cartão.
    if (t.cardId) return false;
    if (filtroTipo.value && t.tipo !== filtroTipo.value) return false;
    if (filtroStatus.value === "previsto" && !t.previsto) return false;
    if (filtroStatus.value === "realizado" && !t.realizado) return false;
    if (filtroStatus.value === "pendente" && t.realizado) return false;
    return true;
  }),
);

// ── Segmentos: Receitas e Despesas (faturas de cartão entram em Despesas) ──
interface Segmento {
  key: TipoTransacao;
  label: string;
  rows: Transaction[];
  faturas: typeof faturasMes.value;
}

const segmentos = computed<Segmento[]>(() => {
  const segs: Segmento[] = [];
  const recRows = linhas.value.filter((t) => t.tipo === "receita") as Transaction[];
  const despRows = linhas.value.filter((t) => t.tipo === "despesa") as Transaction[];

  if (filtroTipo.value !== "despesa") {
    segs.push({ key: "receita", label: "Receitas", rows: recRows, faturas: [] });
  }
  if (filtroTipo.value !== "receita") {
    segs.push({
      key: "despesa",
      label: "Despesas",
      rows: despRows,
      faturas: faturasMes.value,
    });
  }
  return segs;
});

const semNada = computed(() =>
  segmentos.value.every((s) => s.rows.length === 0 && s.faturas.length === 0),
);

// Total previsto do segmento (somando faturas de cartão quando despesa).
function totalSegmento(seg: Segmento): number {
  const rows = seg.rows.reduce((s, t) => s + prev(t), 0);
  const fat = seg.faturas.reduce((s, f) => s + f.valorFinal, 0);
  return rows + fat;
}

const columns: Column<Transaction>[] = [
  { key: "data", label: "Vencimento" },
  { key: "dataEfetivacao", label: "Efetivação" },
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
  { label: "A pagar/receber", value: "pendente" },
  { label: "Previstos", value: "previsto" },
  { label: "Pagos/recebidos", value: "realizado" },
];

function fmtData(ts: Transaction["data"]): string {
  try {
    return ts.toDate().toLocaleDateString("pt-BR");
  } catch {
    return "—";
  }
}

// Data opcional (efetivação): "—" enquanto não houver.
function fmtDataOpt(ts?: Transaction["dataEfetivacao"]): string {
  if (!ts) return "—";
  try {
    return ts.toDate().toLocaleDateString("pt-BR");
  } catch {
    return "—";
  }
}

// ── Ação rápida: efetivar (pagar/receber) com a data de hoje ──
const efetivando = ref<string | null>(null);
async function efetivar(t: Transaction) {
  if (!t.id || t.realizado) return;
  efetivando.value = t.id;
  try {
    await updateTransaction(t.id, {
      realizado: true,
      // Sem valor efetivo informado: assume o previsto.
      valor: prev(t),
      dataEfetivacao: new Date(),
    });
    toast.success(t.tipo === "despesa" ? "Despesa paga." : "Receita recebida.");
  } catch (e) {
    toast.error("Não foi possível efetivar.");
    console.error(e);
  } finally {
    efetivando.value = null;
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
  dataEfetivacaoISO: hojeISO(),
  accountId: "" as string,
  categoryId: "" as string,
  previsto: true,
  realizado: false,
  fixa: false,
  essencial: false,
});

// Ao marcar "já paguei/recebi", sugere a data de efetivação de hoje.
watch(
  () => form.realizado,
  (r) => {
    if (r && !form.dataEfetivacaoISO) form.dataEfetivacaoISO = hojeISO();
  },
);

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

// Ao escolher categoria, herda os defaults de "fixa" e "essencial" (só despesa).
watch(
  () => form.categoryId,
  (id) => {
    if (form.tipo !== "despesa") return;
    const cat = categories.value.find((c) => c.id === id);
    if (cat) {
      form.fixa = cat.fixaPorPadrao;
      form.essencial = cat.essencialPorPadrao ?? false;
    }
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
    dataEfetivacaoISO: hojeISO(),
    accountId: "",
    categoryId: "",
    previsto: true,
    realizado: false,
    fixa: false,
    essencial: false,
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
    dataEfetivacaoISO: t.dataEfetivacao
      ? t.dataEfetivacao.toDate().toISOString().slice(0, 10)
      : hojeISO(),
    accountId: t.accountId ?? "",
    categoryId: t.categoryId ?? "",
    previsto: t.previsto,
    realizado: t.realizado,
    fixa: t.fixa,
    essencial: t.essencial ?? false,
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
      essencial: form.tipo === "despesa" ? form.essencial : false,
      descricao: form.descricao.trim(),
    };
    // Data de efetivação: só quando realizado.
    const dataEfetivacao = form.realizado
      ? new Date(form.dataEfetivacaoISO + "T12:00:00")
      : undefined;
    if (editingId.value) {
      // null limpa a efetivação caso o lançamento volte a ser apenas previsto.
      await updateTransaction(editingId.value, {
        ...payload,
        dataEfetivacao: dataEfetivacao ?? null,
      });
      toast.success("Lançamento atualizado.");
    } else {
      await createTransaction({ ...payload, dataEfetivacao });
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
          <OrenButton
            v-if="fixasParaCopiar.length"
            size="sm"
            variant="secondary"
            :loading="copiando"
            @click="copiarFixas"
          >
            Copiar {{ fixasParaCopiar.length }} fixa(s) de {{ competenciaLabel(prevComp) }}
          </OrenButton>
          <OrenSelect v-model="filtroTipo" :options="tipoFiltroOptions" />
          <OrenSelect v-model="filtroStatus" :options="statusFiltroOptions" />
        </div>
      </div>

      <p v-if="semNada" class="empty">
        Nenhum lançamento neste mês com os filtros atuais.
      </p>

      <!-- Segmentos: Receitas e Despesas (cartões entram como fatura em Despesas) -->
      <section v-for="seg in segmentos" :key="seg.key" class="segmento">
        <div class="segmento__head" :class="`segmento__head--${seg.key}`">
          <h2 class="segmento__title">{{ seg.label }}</h2>
          <span
            class="segmento__total"
            :class="seg.key === 'receita' ? 'val-pos' : 'val-neg'"
          >
            {{ seg.key === "receita" ? "+" : "−" }}{{ formatBRL(totalSegmento(seg)) }}
            <span class="prev-hint">previsto</span>
          </span>
        </div>

        <!-- Faturas de cartão deste mês (o cartão é mais uma despesa) -->
        <div v-if="seg.faturas.length" class="faturas">
          <div
            v-for="f in seg.faturas"
            :key="f.invoiceId"
            class="fatura-row"
            @click="router.push({ name: 'card-detail', params: { cardId: f.cardId } })"
          >
            <div>
              <strong>Fatura {{ f.cardNome }}</strong>
              <OrenBadge v-if="f.status === 'paga'" variant="success">paga</OrenBadge>
              <OrenBadge v-else variant="warning">a pagar</OrenBadge>
            </div>
            <div class="fatura-row__right">
              <span class="val-neg">−{{ formatBRL(f.valorFinal) }}</span>
              <span class="prev-hint">
                {{
                  f.status === "paga"
                    ? `paga em ${fmtVenc(f.dataPagamentoMs)}`
                    : `vence ${fmtVenc(f.vencimentoMs)}`
                }}
              </span>
            </div>
          </div>
        </div>

        <p v-if="!seg.rows.length && !seg.faturas.length" class="empty empty--seg">
          Nenhum lançamento.
        </p>

        <OrenTable v-if="seg.rows.length" :columns="columns" :rows="seg.rows">
          <template #cell-data="{ row }">{{ fmtData(row.data) }}</template>
          <template #cell-dataEfetivacao="{ row }">
            <span :class="{ 'prev-hint': !row.dataEfetivacao }">
              {{ fmtDataOpt(row.dataEfetivacao) }}
            </span>
          </template>
          <template #cell-categoryId="{ value }">{{ nomeCategoria(value as string) }}</template>
          <template #cell-accountId="{ value }">{{ nomeConta(value as string) }}</template>
          <template #cell-previsto="{ row }">
            <div class="status-badges">
              <OrenBadge v-if="row.previsto && !row.realizado" variant="warning">
                {{ row.tipo === "despesa" ? "A pagar" : "A receber" }}
              </OrenBadge>
              <OrenBadge v-if="row.realizado" variant="success">
                {{ row.tipo === "despesa" ? "Pago" : "Recebido" }}
              </OrenBadge>
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
              <OrenButton
                v-if="!row.realizado"
                size="sm"
                variant="primary"
                :loading="efetivando === row.id"
                @click="efetivar(row)"
              >
                {{ row.tipo === "despesa" ? "Pagar" : "Receber" }}
              </OrenButton>
              <OrenButton size="sm" variant="ghost" @click="abrirEdicao(row)">Editar</OrenButton>
              <OrenButton size="sm" variant="danger" @click="remover(row)">Excluir</OrenButton>
            </div>
          </template>
        </OrenTable>
      </section>
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
          <OrenToggle v-model="form.realizado">
            {{ form.tipo === "despesa" ? "Já paguei" : "Já recebi" }}
          </OrenToggle>
          <OrenToggle v-if="form.tipo === 'despesa'" v-model="form.fixa">
            Fixa (repete nos próximos meses)
          </OrenToggle>
          <OrenToggle v-if="form.tipo === 'despesa'" v-model="form.essencial">
            Essencial (entra no % da receita)
          </OrenToggle>
        </div>

        <!-- Valor efetivo: só ao pagar/receber -->
        <template v-if="form.realizado">
          <MoneyInput
            v-model="form.valorEfetivo"
            :label="form.tipo === 'despesa' ? 'Valor pago (R$)' : 'Valor recebido (R$)'"
          />
        </template>

        <div class="field">
          <label>Data de vencimento</label>
          <input v-model="form.dataISO" type="date" class="date-input" />
        </div>

        <!-- Data de efetivação: só quando pago/recebido -->
        <div v-if="form.realizado" class="field">
          <label>
            {{ form.tipo === "despesa" ? "Data do pagamento" : "Data do recebimento" }}
          </label>
          <input v-model="form.dataEfetivacaoISO" type="date" class="date-input" />
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
  min-width: 160px;
  text-align: center;
}
/* Capitaliza só a primeira letra ("junho de 2026" -> "Junho de 2026"). */
.month-label::first-letter {
  text-transform: uppercase;
}
.filters {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}
.empty {
  color: var(--text-muted);
  font-size: 14px;
}
.empty--seg {
  margin: 0 0 4px;
}
.segmento {
  margin-bottom: 28px;
}
.segmento__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 8px;
  margin-bottom: 12px;
  border-bottom: 2px solid var(--border-default);
}
.segmento__head--receita {
  border-bottom-color: var(--action-primary, #1f7a4d);
}
.segmento__head--despesa {
  border-bottom-color: #b42318;
}
.segmento__title {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
}
.segmento__total {
  font-size: 15px;
  font-weight: 600;
  text-align: right;
}
.segmento__total .prev-hint {
  font-weight: 400;
}
.faturas {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}
.fatura-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 1px dashed var(--border-default);
  border-radius: var(--radius);
  background: var(--surface-subtle);
  cursor: pointer;
}
.fatura-row:hover {
  background: var(--surface-raised);
}
.fatura-row > div:first-child {
  display: flex;
  align-items: center;
  gap: 8px;
}
.fatura-row__right {
  display: flex;
  align-items: center;
  gap: 12px;
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
