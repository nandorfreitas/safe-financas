<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  OrenPage,
  OrenButton,
  OrenCard,
  OrenBadge,
  OrenTable,
  OrenModal,
  OrenInput,
  OrenSelect,
  useToast,
} from "@/ui";
import type { Column, SelectOption } from "@/ui";
import MoneyInput from "@/components/MoneyInput.vue";
import ImportCsvModal from "@/components/ImportCsvModal.vue";
import {
  useCards,
  useInvoices,
  useCardTransactions,
  useAccounts,
  useCategories,
} from "@/composables/useData";
import { setValorPrevisto, pagarFatura, reabrirFatura } from "@/services/invoices";
import {
  createCardPurchase,
  createCardCredit,
  deleteCardPurchase,
} from "@/services/transactions";
import { ensureSubscriptionCharges } from "@/services/subscriptions";
import { formatBRL } from "@/lib/money";
import {
  competenciaDe,
  competenciaLabel,
  addMeses,
} from "@/lib/competencia";
import type { Transaction } from "@/types/models";

const route = useRoute();
const router = useRouter();
const toast = useToast();

const cardId = computed(() => route.params.cardId as string);
const cards = useCards();
const card = computed(() => cards.value.find((c) => c.id === cardId.value) ?? null);

const competencia = ref(competenciaDe());
const invoices = useInvoices(cardId);
const purchases = useCardTransactions(cardId);
const accounts = useAccounts();
const categories = useCategories();

// Materializa as cobranças de assinaturas na fatura ao abrir cada mês
// (idempotente). A fatura e as compras são reativas, então atualizam sozinhas.
watch(
  competencia,
  async (comp) => {
    try {
      await ensureSubscriptionCharges(comp);
    } catch (e) {
      console.error(e);
    }
  },
  { immediate: true },
);

const invoice = computed(
  () => invoices.value.find((i) => i.competencia === competencia.value) ?? null,
);

// Fatura paga é imutável: não aceita novas compras (reabra para lançar).
const faturaPaga = computed(() => invoice.value?.status === "paga");

const comprasDoMes = computed(() =>
  [...purchases.value]
    .filter((t) => t.competencia === competencia.value)
    .sort((a, b) => a.data.toMillis() - b.data.toMillis()),
);

// Import de CSV: hashes já existentes (dedup) e controle do modal.
const importModal = ref(false);
const hashesExistentes = computed(() =>
  purchases.value.map((t) => t.importHash).filter((h): h is string => !!h),
);
// Compras comuns da competência (exclui cobranças de assinatura) — para "substituir".
const substituiveis = computed(() =>
  comprasDoMes.value
    .filter((t) => t.id && !t.subscriptionId)
    .map((t) => ({ id: t.id as string, valor: t.valor })),
);

const contas = computed(() =>
  accounts.value.filter((a) => a.tipo === "conta" && !a.arquivada),
);

function nomeConta(id?: string) {
  return id ? accounts.value.find((a) => a.id === id)?.nome ?? "—" : "—";
}
function nomeCategoria(id?: string) {
  return id ? categories.value.find((c) => c.id === id)?.nome ?? "—" : "—";
}

const columns: Column<Transaction>[] = [
  { key: "data", label: "Data" },
  { key: "descricao", label: "Compra" },
  { key: "categoryId", label: "Categoria" },
  { key: "parcelaNum", label: "Parcela" },
  { key: "valor", label: "Valor" },
  { key: "id", label: "" },
];

function fmtData(ts: Transaction["data"]) {
  try {
    return ts.toDate().toLocaleDateString("pt-BR");
  } catch {
    return "—";
  }
}

// ── Editar a meta (valorPrevisto) ──
const metaEdit = ref(0);
watch(
  invoice,
  (inv) => {
    metaEdit.value = inv?.valorPrevisto ?? inv?.valorRegistrado ?? 0;
  },
  { immediate: true },
);

const salvandoMeta = ref(false);
async function salvarMeta() {
  if (!invoice.value?.id) return;
  salvandoMeta.value = true;
  try {
    await setValorPrevisto(cardId.value, invoice.value.id, metaEdit.value);
    toast.success("Meta atualizada.");
  } catch (e) {
    toast.error("Não foi possível salvar.");
    console.error(e);
  } finally {
    salvandoMeta.value = false;
  }
}

// ── Nova compra ──
const compraModal = ref(false);
const salvandoCompra = ref(false);
const compra = reactive({
  descricao: "",
  valorTotal: 0,
  parcelaTotal: 1,
  categoryId: "",
  dataISO: new Date().toISOString().slice(0, 10),
});

const categoriaOptions = computed<SelectOption[]>(() => [
  { label: "— sem categoria —", value: "" },
  ...categories.value
    .filter((c) => c.tipo === "despesa" && !c.arquivada)
    .map((c) => ({ label: c.nome, value: c.id ?? "" })),
]);

function abrirCompra() {
  if (faturaPaga.value) {
    toast.error("Fatura paga — reabra para lançar novas compras.");
    return;
  }
  Object.assign(compra, {
    descricao: "",
    valorTotal: 0,
    parcelaTotal: 1,
    categoryId: "",
    dataISO: new Date().toISOString().slice(0, 10),
  });
  compraModal.value = true;
}

async function salvarCompra() {
  if (!card.value) return;
  if (faturaPaga.value) {
    toast.error("Fatura paga — reabra para lançar novas compras.");
    return;
  }
  if (!compra.descricao.trim()) {
    toast.error("Informe uma descrição.");
    return;
  }
  if (compra.valorTotal <= 0) {
    toast.error("Informe um valor maior que zero.");
    return;
  }
  const n = Number(compra.parcelaTotal);
  if (!Number.isInteger(n) || n < 1 || n > 99) {
    toast.error("Número de parcelas inválido.");
    return;
  }
  salvandoCompra.value = true;
  try {
    await createCardPurchase({
      cardId: cardId.value,
      diaVencimento: card.value.diaVencimento,
      competenciaInicial: competencia.value,
      valorTotal: compra.valorTotal,
      parcelaTotal: n,
      categoryId: compra.categoryId || undefined,
      descricao: compra.descricao.trim(),
      dataCompra: new Date(compra.dataISO + "T12:00:00"),
    });
    toast.success(n > 1 ? `Compra em ${n}x lançada.` : "Compra lançada.");
    compraModal.value = false;
  } catch (e) {
    toast.error("Não foi possível lançar a compra.");
    console.error(e);
  } finally {
    salvandoCompra.value = false;
  }
}

async function removerCompra(t: Transaction) {
  const ehCredito = t.valor < 0;
  if (!confirm(ehCredito ? "Excluir este crédito/estorno?" : "Excluir esta compra/parcela?")) return;
  try {
    await deleteCardPurchase(t);
    toast.success(ehCredito ? "Crédito removido." : "Compra removida.");
  } catch (e) {
    toast.error("Não foi possível remover.");
    console.error(e);
  }
}

// ── Crédito / estorno (abate a fatura) ──
const creditoModal = ref(false);
const salvandoCredito = ref(false);
const credito = reactive({
  descricao: "",
  valor: 0,
  categoryId: "",
  dataISO: new Date().toISOString().slice(0, 10),
});

function abrirCredito() {
  if (faturaPaga.value) {
    toast.error("Fatura paga — reabra para lançar créditos.");
    return;
  }
  Object.assign(credito, {
    descricao: "",
    valor: 0,
    categoryId: "",
    dataISO: new Date().toISOString().slice(0, 10),
  });
  creditoModal.value = true;
}

async function salvarCredito() {
  if (!card.value) return;
  if (faturaPaga.value) {
    toast.error("Fatura paga — reabra para lançar créditos.");
    return;
  }
  if (!credito.descricao.trim()) {
    toast.error("Informe uma descrição.");
    return;
  }
  if (credito.valor <= 0) {
    toast.error("Informe o valor do crédito (positivo).");
    return;
  }
  salvandoCredito.value = true;
  try {
    await createCardCredit({
      cardId: cardId.value,
      diaVencimento: card.value.diaVencimento,
      competencia: competencia.value,
      valor: credito.valor,
      descricao: credito.descricao.trim(),
      categoryId: credito.categoryId || undefined,
      data: new Date(credito.dataISO + "T12:00:00"),
    });
    toast.success("Crédito/estorno lançado.");
    creditoModal.value = false;
  } catch (e) {
    toast.error("Não foi possível lançar o crédito.");
    console.error(e);
  } finally {
    salvandoCredito.value = false;
  }
}

// ── Pagamento ──
const pagamentoModal = ref(false);
const contaPagadora = ref("");
const pagando = ref(false);

const contaOptions = computed<SelectOption[]>(() =>
  contas.value.map((a) => ({
    label: `${a.nome} — ${formatBRL(a.saldo)}`,
    value: a.id ?? "",
  })),
);

function abrirPagamento() {
  contaPagadora.value = contas.value[0]?.id ?? "";
  pagamentoModal.value = true;
}

async function confirmarPagamento() {
  if (!invoice.value?.id) return;
  if (!contaPagadora.value) {
    toast.error("Selecione a conta pagadora.");
    return;
  }
  pagando.value = true;
  try {
    await pagarFatura(
      cardId.value,
      invoice.value.id,
      contaPagadora.value,
      invoice.value.valorRegistrado,
    );
    toast.success("Fatura paga — saldo da conta atualizado.");
    pagamentoModal.value = false;
  } catch (e) {
    toast.error("Não foi possível pagar a fatura.");
    console.error(e);
  } finally {
    pagando.value = false;
  }
}

async function desfazerPagamento() {
  if (!invoice.value?.id || !invoice.value.pagaPorContaId) return;
  if (!confirm("Reabrir a fatura e devolver o valor à conta?")) return;
  try {
    await reabrirFatura(
      cardId.value,
      invoice.value.id,
      invoice.value.pagaPorContaId,
      invoice.value.valorRegistrado,
    );
    toast.success("Fatura reaberta.");
  } catch (e) {
    toast.error("Não foi possível reabrir.");
    console.error(e);
  }
}
</script>

<template>
  <OrenPage
    subtitle="Patrimônio"
    :title="card?.nome ?? 'Cartão'"
    :description="`Vencimento dia ${card?.diaVencimento ?? '—'}`"
  >
    <template #actions>
      <OrenButton variant="ghost" @click="router.push({ name: 'cards' })">
        ‹ Cartões
      </OrenButton>
    </template>

    <div class="page-pad">
      <!-- Navegação de competência -->
      <div class="month-nav">
        <OrenButton size="sm" variant="ghost" @click="competencia = addMeses(competencia, -1)">‹</OrenButton>
        <span class="month-label">{{ competenciaLabel(competencia) }}</span>
        <OrenButton size="sm" variant="ghost" @click="competencia = addMeses(competencia, 1)">›</OrenButton>
      </div>

      <!-- Resumo da fatura -->
      <OrenCard class="invoice-card">
        <div class="invoice-grid">
          <div class="metric">
            <span class="metric__label">Valor previsto (meta)</span>
            <div class="final-edit">
              <MoneyInput v-model="metaEdit" :disabled="!invoice || invoice.status === 'paga'" />
              <OrenButton
                size="sm"
                variant="secondary"
                :loading="salvandoMeta"
                :disabled="!invoice || invoice.status === 'paga'"
                @click="salvarMeta"
              >
                Salvar
              </OrenButton>
            </div>
            <span class="metric__hint">sua meta de gasto — entra no previsto</span>
          </div>

          <div class="metric">
            <span class="metric__label">Valor da fatura (o que se paga)</span>
            <span class="metric__value">{{ formatBRL(invoice?.valorRegistrado ?? 0) }}</span>
            <span class="metric__hint">
              soma das compras — ajuste lançando uma compra extra
            </span>
          </div>

          <div class="metric">
            <span class="metric__label">Status</span>
            <div>
              <OrenBadge :variant="invoice?.status === 'paga' ? 'success' : 'warning'">
                {{ invoice?.status === "paga" ? "Paga" : "Aberta" }}
              </OrenBadge>
            </div>
            <span v-if="invoice?.status === 'paga'" class="metric__hint">
              paga por {{ nomeConta(invoice.pagaPorContaId) }}
            </span>
          </div>

          <div class="metric metric--actions">
            <OrenButton
              v-if="invoice && invoice.status === 'aberta'"
              variant="primary"
              :disabled="invoice.valorRegistrado <= 0"
              @click="abrirPagamento"
            >
              Pagar fatura
            </OrenButton>
            <OrenButton
              v-else-if="invoice && invoice.status === 'paga'"
              variant="ghost"
              @click="desfazerPagamento"
            >
              Reabrir fatura
            </OrenButton>
          </div>
        </div>
      </OrenCard>

      <!-- Compras -->
      <div class="section-head">
        <h3>Compras desta competência</h3>
        <div class="section-head__actions">
          <OrenButton
            variant="ghost"
            size="sm"
            :disabled="faturaPaga"
            :title="faturaPaga ? 'Fatura paga — reabra para importar.' : ''"
            @click="importModal = true"
          >
            Importar fatura
          </OrenButton>
          <OrenButton
            variant="ghost"
            size="sm"
            :disabled="faturaPaga"
            :title="faturaPaga ? 'Fatura paga — reabra para lançar créditos.' : ''"
            @click="abrirCredito"
          >
            Crédito/estorno
          </OrenButton>
          <OrenButton
            variant="primary"
            size="sm"
            :disabled="faturaPaga"
            :title="faturaPaga ? 'Fatura paga — reabra para lançar novas compras.' : ''"
            @click="abrirCompra"
          >
            Nova compra
          </OrenButton>
        </div>
      </div>

      <p v-if="comprasDoMes.length === 0" class="empty">
        Nenhuma compra lançada nesta competência.
      </p>

      <OrenTable v-else :columns="columns" :rows="comprasDoMes">
        <template #cell-data="{ row }">{{ fmtData(row.data) }}</template>
        <template #cell-descricao="{ row }">
          {{ row.descricao }}
          <OrenBadge v-if="row.valor < 0" variant="success">crédito</OrenBadge>
        </template>
        <template #cell-categoryId="{ value }">{{ nomeCategoria(value as string) }}</template>
        <template #cell-parcelaNum="{ row }">
          <span v-if="row.parcelaTotal && row.parcelaTotal > 1">
            {{ row.parcelaNum }}/{{ row.parcelaTotal }}
          </span>
          <span v-else>—</span>
        </template>
        <template #cell-valor="{ row }">
          <span :class="{ 'val-credito': row.valor < 0 }">{{ formatBRL(row.valor) }}</span>
        </template>
        <template #cell-id="{ row }">
          <div class="row-actions">
            <OrenButton size="sm" variant="danger" @click="removerCompra(row)">Excluir</OrenButton>
          </div>
        </template>
      </OrenTable>
    </div>

    <!-- Modal nova compra -->
    <OrenModal v-model="compraModal" title="Nova compra no cartão">
      <div class="form">
        <OrenInput v-model="compra.descricao" label="Descrição" placeholder="Ex.: Notebook" />
        <MoneyInput v-model="compra.valorTotal" label="Valor total (R$)" />
        <OrenInput
          v-model.number="compra.parcelaTotal"
          label="Parcelas"
          type="number"
        />
        <OrenSelect v-model="compra.categoryId" label="Categoria" :options="categoriaOptions" />
        <div class="field">
          <label>Data da compra</label>
          <input v-model="compra.dataISO" type="date" class="date-input" />
        </div>
        <p class="hint">
          A 1ª parcela cai na competência <b>{{ competenciaLabel(competencia) }}</b>; as
          demais nas competências seguintes.
        </p>
      </div>
      <template #footer="{ close }">
        <OrenButton variant="ghost" @click="close">Cancelar</OrenButton>
        <OrenButton variant="primary" :loading="salvandoCompra" @click="salvarCompra">
          Lançar
        </OrenButton>
      </template>
    </OrenModal>

    <!-- Modal crédito/estorno -->
    <OrenModal v-model="creditoModal" title="Crédito / estorno na fatura">
      <div class="form">
        <OrenInput
          v-model="credito.descricao"
          label="Descrição"
          placeholder="Ex.: Cashback, Estorno compra X"
        />
        <MoneyInput v-model="credito.valor" label="Valor do crédito (R$)" />
        <OrenSelect v-model="credito.categoryId" label="Categoria (opcional)" :options="categoriaOptions" />
        <div class="field">
          <label>Data do crédito</label>
          <input v-model="credito.dataISO" type="date" class="date-input" />
        </div>
        <p class="hint">
          O crédito <b>abate</b> o valor da fatura de
          <b>{{ competenciaLabel(competencia) }}</b> (entra como valor negativo).
        </p>
      </div>
      <template #footer="{ close }">
        <OrenButton variant="ghost" @click="close">Cancelar</OrenButton>
        <OrenButton variant="primary" :loading="salvandoCredito" @click="salvarCredito">
          Lançar crédito
        </OrenButton>
      </template>
    </OrenModal>

    <!-- Modal pagamento -->
    <OrenModal v-model="pagamentoModal" title="Pagar fatura">
      <div class="form">
        <p class="hint">
          O pagamento <b>não é uma transação</b>: ele baixa o saldo da conta pagadora em
          {{ formatBRL(invoice?.valorRegistrado ?? 0) }} e marca a fatura como paga. O gasto
          já foi contabilizado nas compras.
        </p>
        <OrenSelect v-model="contaPagadora" label="Conta pagadora" :options="contaOptions" />
      </div>
      <template #footer="{ close }">
        <OrenButton variant="ghost" @click="close">Cancelar</OrenButton>
        <OrenButton variant="primary" :loading="pagando" @click="confirmarPagamento">
          Confirmar pagamento
        </OrenButton>
      </template>
    </OrenModal>

    <!-- Import de CSV -->
    <ImportCsvModal
      v-model="importModal"
      :card-id="cardId"
      :dia-vencimento="card?.diaVencimento ?? 1"
      :competencia="competencia"
      :existing-hashes="hashesExistentes"
      :substituiveis="substituiveis"
    />
  </OrenPage>
</template>

<style scoped>
.month-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 18px;
}
.month-label {
  font-size: 16px;
  font-weight: 500;
  text-transform: capitalize;
  min-width: 160px;
  text-align: center;
}
.invoice-card {
  margin-bottom: 24px;
}
.invoice-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  align-items: start;
}
.metric {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.metric__label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}
.metric__value {
  font-size: 22px;
  font-weight: 600;
}
.metric__hint {
  font-size: 12px;
  color: var(--text-muted);
}
.final-edit {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}
.metric--actions {
  justify-content: center;
}
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.section-head h3 {
  margin: 0;
  font-weight: 500;
}
.section-head__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.empty {
  color: var(--text-muted);
  font-size: 14px;
}
.row-actions {
  display: flex;
  justify-content: flex-end;
}
.val-credito {
  color: var(--action-primary, #1f7a4d);
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
.hint {
  margin: 0;
  font-size: 13px;
  color: var(--text-muted);
}
</style>
