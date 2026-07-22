<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { OrenPage, OrenButton, OrenStatCard, OrenCard, OrenBadge } from "@/ui";
import { useWorkspaceStore } from "@/stores/workspace";
import { useBudget } from "@/composables/useBudget";
import {
  useCardBills,
  useCardTransactionsMonth,
  useSubscriptions,
  useCategories,
  refreshMonthData,
  type CardBill,
} from "@/composables/useData";
import { ensureSubscriptionCharges } from "@/services/subscriptions";
import { resolveTop } from "@/lib/categoryTree";
import { formatBRL } from "@/lib/money";
import { addMeses, competenciaDe, competenciaLabel } from "@/lib/competencia";

const router = useRouter();
const wsStore = useWorkspaceStore();
const competencia = ref(competenciaDe());

// Assinaturas: materializa as cobranças do mês ao abri-lo (idempotente) e
// recarrega os dados de fatura. Total mensal exibido em um card.
const subs = useSubscriptions();
const totalAssinaturas = computed(() =>
  subs.value
    .filter((s) => s.ativa && !s.arquivado && s.inicioCompetencia <= competencia.value)
    .reduce((acc, s) => acc + s.valor, 0),
);

watch(
  competencia,
  async (comp) => {
    try {
      const criadas = await ensureSubscriptionCharges(comp);
      if (criadas > 0) refreshMonthData();
    } catch (e) {
      console.error(e);
    }
  },
  { immediate: true },
);

const {
  saldoAtual,
  projecaoSaldoFinal,
  aReceber,
  aPagar,
  recebidoMes,
  pagoMes,
  despesasEssenciais,
  percentEssenciais,
  despesasFixas,
  totalInvestimentos,
  txs,
} = useBudget(competencia);

// Faturas dos cartões: do mês selecionado (abertas ou pagas) + atrasadas.
const faturas = useCardBills(competencia);

// Sinal da projeção, para colorir (verde positivo / vermelho negativo).
const projecaoPositiva = computed(() => projecaoSaldoFinal.value >= 0);

// ── Gráfico 3: Despesas previstas por categoria (barras horizontais) ──
const categories = useCategories();
function catNome(id: string) {
  return categories.value.find((c) => c.id === id)?.nome ?? "—";
}
function catCor(id: string) {
  return categories.value.find((c) => c.id === id)?.cor ?? "var(--text-muted)";
}
// Compras de cartão da competência = mês da FATURA (mês do pagamento). O gasto do
// cartão é atribuído por competência, não pela data da compra — coerente com o
// resto do dashboard (faturas, gasto no mês).
const cardTxs = useCardTransactionsMonth(competencia);

const despesasPorCategoria = computed(() => {
  const map = new Map<string, number>();
  const add = (categoryId: string | undefined, valor: number) => {
    // Agrega na categoria de TOPO (subcategorias somam no pai).
    const top = resolveTop(categories.value, categoryId);
    const k = top?.id ?? "";
    map.set(k, (map.get(k) ?? 0) + valor);
  };
  // Despesas de caixa: por data (competência do mês) e só o previsto.
  for (const t of txs.value) {
    if (t.tipo !== "despesa" || t.cardId || !t.previsto) continue;
    add(t.categoryId, t.valorPrevisto ?? t.valor);
  }
  // Compras de cartão: pela competência da fatura (mês do pagamento), valor real.
  for (const t of cardTxs.value) {
    if (t.tipo !== "despesa") continue;
    add(t.categoryId, t.valor);
  }
  const arr = [...map.entries()].map(([id, valor]) => ({
    nome: id ? catNome(id) : "Sem categoria",
    cor: id ? catCor(id) : "var(--text-muted)",
    valor,
  }));
  return arr.filter((c) => c.valor > 0).sort((a, b) => b.valor - a.valor);
});
const maxCat = computed(() =>
  Math.max(1, ...despesasPorCategoria.value.map((c) => c.valor)),
);
function larguraCat(v: number) {
  return `${(v / maxCat.value) * 100}%`;
}

function fmtVenc(ms: number) {
  return ms ? new Date(ms).toLocaleDateString("pt-BR") : "—";
}

function statusVariant(b: CardBill) {
  if (b.status === "paga") return "success";
  return b.atrasada ? "error" : "warning";
}
function statusLabel(b: CardBill) {
  if (b.status === "paga") return `paga ${fmtVenc(b.dataPagamentoMs)}`;
  return b.atrasada ? "atrasada" : `vence ${fmtVenc(b.vencimentoMs)}`;
}
</script>

<template>
  <OrenPage
    subtitle="Visão geral"
    title="Dashboard"
    :description="`${wsStore.active?.name ?? ''} · ${competenciaLabel(competencia)}`"
  >
    <div class="page-pad">
      <!-- Navegação de competência -->
      <div class="month-nav">
        <OrenButton size="sm" variant="ghost" @click="competencia = addMeses(competencia, -1)">
          ‹
        </OrenButton>
        <span class="month-label">{{ competenciaLabel(competencia) }}</span>
        <OrenButton size="sm" variant="ghost" @click="competencia = addMeses(competencia, 1)">
          ›
        </OrenButton>
      </div>

      <!-- Destaque: Saldo atual efetivo × Projeção prevista -->
      <section class="hero">
        <div class="hero__headline">
          <div class="hero__metric">
            <span class="hero__label">Saldo atual efetivo</span>
            <span class="hero__value">{{ formatBRL(saldoAtual) }}</span>
            <span class="hero__hint">saldo real das contas hoje</span>
          </div>
          <span class="hero__arrow">→</span>
          <div class="hero__metric">
            <span class="hero__label">Projeção prevista</span>
            <span class="hero__value" :class="projecaoPositiva ? 'val-pos' : 'val-neg'">
              {{ formatBRL(projecaoSaldoFinal) }}
            </span>
            <span class="hero__hint">
              se tudo ocorrer como previsto em {{ competenciaLabel(competencia) }}
            </span>
          </div>
        </div>
        <div class="bridge">
          <div class="bridge__item">
            <span class="bridge__k">Saldo atual</span>
            <span class="bridge__v">{{ formatBRL(saldoAtual) }}</span>
          </div>
          <span class="bridge__op">+</span>
          <div class="bridge__item">
            <span class="bridge__k">A receber (previsto)</span>
            <span class="bridge__v val-pos">{{ formatBRL(aReceber) }}</span>
          </div>
          <span class="bridge__op">−</span>
          <div class="bridge__item">
            <span class="bridge__k">A pagar (previsto)</span>
            <span class="bridge__v val-neg">{{ formatBRL(aPagar) }}</span>
          </div>
        </div>
      </section>

      <!-- Realizado no mês + patrimônio -->
      <div class="sec-grid">
        <OrenStatCard
          label="Recebido no mês"
          :value="formatBRL(recebidoMes)"
          source="receitas já recebidas"
        />
        <OrenStatCard
          label="Gasto no mês"
          :value="formatBRL(pagoMes)"
          source="despesas + faturas pagas"
        />
        <OrenStatCard
          label="Investimentos"
          :value="formatBRL(totalInvestimentos)"
          tone="governance"
          source="patrimônio, fora do caixa"
        />
      </div>

      <!-- Composição das despesas previstas (categorias se sobrepõem) -->
      <OrenCard class="despesas">
        <template #title>Despesas previstas do mês</template>
        <div class="despesas__grid">
          <div class="dz">
            <span class="dz__k">Essenciais</span>
            <span class="dz__v">{{ formatBRL(despesasEssenciais) }}</span>
            <span class="dz__h">{{ Math.round(percentEssenciais) }}% da receita prevista</span>
          </div>
          <div class="dz">
            <span class="dz__k">Fixas</span>
            <span class="dz__v">{{ formatBRL(despesasFixas) }}</span>
            <span class="dz__h">recorrentes</span>
          </div>
          <div class="dz">
            <span class="dz__k">Assinaturas</span>
            <span class="dz__v">{{ formatBRL(totalAssinaturas) }}</span>
            <span class="dz__h">nas faturas dos cartões</span>
          </div>
        </div>
        <p class="despesas__note">
          São recortes da mesma despesa e podem se sobrepor (ex.: uma assinatura é fixa) —
          não somam entre si.
        </p>
      </OrenCard>

      <!-- Gráfico 3: Despesas previstas por categoria -->
      <OrenCard class="comp">
        <template #title>Despesas por categoria — {{ competenciaLabel(competencia) }}</template>
        <p v-if="despesasPorCategoria.length === 0" class="muted">
          Sem despesas neste mês.
        </p>
        <ul v-else class="comp__list">
          <li v-for="c in despesasPorCategoria" :key="c.nome" class="comp__row">
            <span class="comp__name">
              <span class="comp__dot" :style="{ background: c.cor }" />
              {{ c.nome }}
            </span>
            <span class="comp__track">
              <span class="comp__fill" :style="{ width: larguraCat(c.valor), background: c.cor }" />
            </span>
            <span class="comp__v">{{ formatBRL(c.valor) }}</span>
          </li>
        </ul>
        <p v-if="despesasPorCategoria.length" class="comp__note">
          Despesas de caixa previstas + compras de cartão pela competência da fatura
          (mês do pagamento). Compras sem categoria aparecem em "Sem categoria".
        </p>
      </OrenCard>

      <OrenCard style="margin-top: 20px">
        <template #title>Faturas dos cartões</template>
        <p v-if="faturas.length === 0" class="muted">
          Nenhuma fatura em {{ competenciaLabel(competencia) }}.
        </p>
        <div v-else class="bills-scroll">
          <div class="bills">
            <div class="bills__head">
              <span>Cartão</span>
              <span>Mês</span>
              <span class="num">Prestações</span>
              <span class="num">Meta (previsto)</span>
              <span class="num">Fatura (realizado)</span>
              <span>Status</span>
            </div>
            <div
              v-for="b in faturas"
              :key="b.invoiceId"
              class="bills__row"
              @click="router.push({ name: 'card-detail', params: { cardId: b.cardId } })"
            >
              <strong>{{ b.cardNome }}</strong>
              <span class="muted">{{ competenciaLabel(b.competencia) }}</span>
              <span class="num">{{ formatBRL(b.somaPrestacoes) }}</span>
              <span class="num">{{ formatBRL(b.valorPrevisto) }}</span>
              <span class="num">{{ formatBRL(b.valorRegistrado) }}</span>
              <span><OrenBadge :variant="statusVariant(b)">{{ statusLabel(b) }}</OrenBadge></span>
            </div>
          </div>
        </div>
      </OrenCard>
    </div>
  </OrenPage>
</template>

<style scoped>
/* ── Destaque (hero): Saldo atual efetivo × Projeção prevista ── */
.hero {
  background: var(--surface-raised);
  border: 1px solid var(--border-default);
  border-radius: var(--radius);
  padding: 24px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.hero__headline {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}
.hero__metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1 1 220px;
}
.hero__arrow {
  font-size: 28px;
  color: var(--text-muted);
  flex: none;
}
.hero__label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}
.hero__value {
  font-size: 36px;
  font-weight: 700;
  line-height: 1.1;
}
.hero__hint {
  font-size: 13px;
  color: var(--text-muted);
}
@media (max-width: 560px) {
  .hero__arrow {
    transform: rotate(90deg);
    align-self: center;
  }
}
.bridge {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
  padding-top: 16px;
  border-top: 1px solid var(--border-subtle, var(--border-default));
}
.bridge__item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.bridge__k {
  font-size: 12px;
  color: var(--text-muted);
}
.bridge__v {
  font-size: 18px;
  font-weight: 600;
}
.bridge__op {
  font-size: 20px;
  color: var(--text-muted);
}

/* ── Realizado no mês + patrimônio ── */
.sec-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}
@media (max-width: 900px) {
  .sec-grid {
    grid-template-columns: 1fr;
  }
}

/* Composição por categoria — barras horizontais */
.comp {
  margin-bottom: 20px;
}
.comp__list {
  list-style: none;
  margin: 6px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.comp__row {
  display: grid;
  grid-template-columns: 180px 1fr auto;
  align-items: center;
  gap: 12px;
}
.comp__name {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.comp__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex: none;
}
.comp__track {
  height: 10px;
  background: var(--surface-subtle);
  border-radius: var(--radius-pill, 999px);
  overflow: hidden;
}
.comp__fill {
  display: block;
  height: 100%;
  border-radius: var(--radius-pill, 999px);
  min-width: 2px;
}
.comp__v {
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.comp__note {
  margin: 16px 0 0;
  padding-top: 14px;
  border-top: 1px solid var(--border-subtle, var(--border-default));
  font-size: 12px;
  color: var(--text-muted);
}
@media (max-width: 560px) {
  .comp__row {
    grid-template-columns: 110px 1fr auto;
    gap: 8px;
  }
}

/* ── Composição das despesas previstas ── */
.despesas {
  margin-bottom: 20px;
}
.despesas__grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
}
.dz {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 2px 24px;
  border-left: 1px solid var(--border-subtle, var(--border-default));
}
.dz:first-child {
  padding-left: 2px;
  border-left: none;
}
@media (max-width: 600px) {
  .despesas__grid {
    grid-template-columns: 1fr;
  }
  .dz {
    padding: 0;
    border-left: none;
  }
  .dz + .dz {
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px solid var(--border-subtle, var(--border-default));
  }
}
.dz__k {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
}
.dz__v {
  font-size: 22px;
  font-weight: 600;
}
.dz__h {
  font-size: 12px;
  color: var(--text-muted);
}
.despesas__note {
  margin: 18px 0 0;
  padding-top: 14px;
  border-top: 1px solid var(--border-subtle, var(--border-default));
  font-size: 12px;
  color: var(--text-muted);
}
.val-pos {
  color: var(--action-primary, #1f7a4d);
}
.val-neg {
  color: #b42318;
}
.month-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 18px;
}
.month-label {
  font-size: 16px;
  font-weight: 500;
  min-width: 160px;
  text-align: center;
}
.month-label::first-letter {
  text-transform: uppercase;
}
.muted {
  color: var(--text-muted);
  font-size: 14px;
  margin: 0;
}
.bills-scroll {
  overflow-x: auto;
}
.bills {
  min-width: 680px;
}
.bills__head,
.bills__row {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr 1fr 1fr 1.1fr;
  align-items: center;
  gap: 12px;
  padding: 12px 4px;
}
.bills__head {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
  border-bottom: 2px solid var(--border-default);
}
.bills__row {
  border-bottom: 1px solid var(--border-subtle, var(--border-default));
  cursor: pointer;
}
.bills__row:last-child {
  border-bottom: none;
}
.bills__row:hover {
  background: var(--surface-subtle);
}
.num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
</style>
