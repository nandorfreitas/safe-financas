/**
 * Composables reativos (VueFire) escopados no workspace ativo.
 * Devem ser chamados dentro de setup().
 *
 * IMPORTANTE — "regras não são filtros": o Firestore só permite uma query de
 * `list` se as restrições garantirem que todo doc retornado passa na Security
 * Rule. Como a visibilidade é um OR ("compartilhada" OU dono == eu), cada lista
 * é feita em DUAS queries (uma por disjunto) e mesclada por id no cliente.
 */
import { computed, ref, watch, type MaybeRefOrGetter, toValue, type Ref } from "vue";
import { useCollection, useDocument } from "vuefire";
import { query, where, orderBy, getDocs, type Query } from "firebase/firestore";
import { storeToRefs } from "pinia";
import {
  accountsRef,
  cardsRef,
  categoriesRef,
  invoicesRef,
  loansRef,
  reviewRef,
  subscriptionsRef,
  transactionsRef,
} from "@/lib/firestore";
import {
  addMeses,
  competenciaDe,
  intervaloCompetencia,
  parseCompetencia,
} from "@/lib/competencia";
import { useWorkspaceStore } from "@/stores/workspace";
import { useAuthStore } from "@/stores/auth";
import type { Competencia, StatusFatura, Transaction } from "@/types/models";

function useCtxRefs() {
  const { activeId } = storeToRefs(useWorkspaceStore());
  const { uid } = storeToRefs(useAuthStore());
  return { wsId: activeId, uid };
}

/**
 * Sinal de "dados do mês mudaram" para forçar recarga dos composables baseados
 * em getDocs (não-reativos a escritas), como faturas do mês e faturas-do-cartão.
 * Materialização de assinaturas chama refreshMonthData() depois de escrever.
 */
const monthTick = ref(0);
export function refreshMonthData() {
  monthTick.value++;
}

/** Mescla duas listas reativas removendo duplicatas por `id`. */
function mergeById<T extends { id?: string }>(a: T[], b: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of [...a, ...b]) {
    if (item.id) map.set(item.id, item);
  }
  return [...map.values()];
}

export function useAccounts() {
  const { wsId, uid } = useCtxRefs();
  const compartilhadas = useCollection(
    computed(() =>
      wsId.value
        ? query(accountsRef(wsId.value), where("visibilidade", "==", "compartilhada"))
        : null,
    ),
  );
  const minhas = useCollection(
    computed(() =>
      wsId.value && uid.value
        ? query(accountsRef(wsId.value), where("donoUid", "==", uid.value))
        : null,
    ),
  );
  return computed(() => mergeById(compartilhadas.value, minhas.value));
}

export function useCards() {
  const { wsId, uid } = useCtxRefs();
  const compartilhados = useCollection(
    computed(() =>
      wsId.value
        ? query(cardsRef(wsId.value), where("visibilidade", "==", "compartilhada"))
        : null,
    ),
  );
  const meus = useCollection(
    computed(() =>
      wsId.value && uid.value
        ? query(cardsRef(wsId.value), where("donoUid", "==", uid.value))
        : null,
    ),
  );
  return computed(() => mergeById(compartilhados.value, meus.value));
}

export function useLoans() {
  const { wsId, uid } = useCtxRefs();
  const compartilhados = useCollection(
    computed(() =>
      wsId.value
        ? query(loansRef(wsId.value), where("visibilidade", "==", "compartilhada"))
        : null,
    ),
  );
  const meus = useCollection(
    computed(() =>
      wsId.value && uid.value
        ? query(loansRef(wsId.value), where("donoUid", "==", uid.value))
        : null,
    ),
  );
  return computed(() => mergeById(compartilhados.value, meus.value));
}

/** Prestações (transações) de um empréstimo, respeitando a visibilidade. */
export function useLoanTransactions(loanId: MaybeRefOrGetter<string | null | undefined>) {
  const { wsId, uid } = useCtxRefs();
  const compartilhadas = useCollection(
    computed(() => {
      const id = toValue(loanId);
      return wsId.value && id
        ? query(
            transactionsRef(wsId.value),
            where("loanId", "==", id),
            where("_visibilidade", "==", "compartilhada"),
          )
        : null;
    }),
  );
  const minhas = useCollection(
    computed(() => {
      const id = toValue(loanId);
      return wsId.value && id && uid.value
        ? query(
            transactionsRef(wsId.value),
            where("loanId", "==", id),
            where("_donoUid", "==", uid.value),
          )
        : null;
    }),
  );
  return computed(() => mergeById(compartilhadas.value, minhas.value));
}

export function useSubscriptions() {
  const { wsId, uid } = useCtxRefs();
  const compartilhadas = useCollection(
    computed(() =>
      wsId.value
        ? query(subscriptionsRef(wsId.value), where("visibilidade", "==", "compartilhada"))
        : null,
    ),
  );
  const minhas = useCollection(
    computed(() =>
      wsId.value && uid.value
        ? query(subscriptionsRef(wsId.value), where("donoUid", "==", uid.value))
        : null,
    ),
  );
  return computed(() => mergeById(compartilhadas.value, minhas.value));
}

export interface OpenInvoice {
  cardId: string;
  cardNome: string;
  invoiceId: string;
  competencia: Competencia;
  /** Meta (previsto). */
  valorPrevisto: number;
  /** Soma das compras (realizado / o que se paga). */
  valorRegistrado: number;
  vencimentoMs: number;
}

/**
 * Faturas em aberto de todos os cartões visíveis (para o dashboard).
 * Recarrega quando a lista de cartões muda. Leitura pontual (getDocs).
 */
export function useOpenInvoices(): Ref<OpenInvoice[]> {
  const { wsId } = useCtxRefs();
  const cards = useCards();
  const result = ref<OpenInvoice[]>([]);

  watch(
    [cards, wsId],
    async ([cardList, ws]) => {
      if (!ws) {
        result.value = [];
        return;
      }
      const ativos = cardList.filter((c) => !c.arquivado && c.id);
      const all: OpenInvoice[] = [];
      await Promise.all(
        ativos.map(async (c) => {
          const snap = await getDocs(
            query(invoicesRef(ws, c.id as string), where("status", "==", "aberta")),
          );
          for (const d of snap.docs) {
            const inv = d.data();
            all.push({
              cardId: c.id as string,
              cardNome: c.nome,
              invoiceId: d.id,
              competencia: inv.competencia,
              valorPrevisto: inv.valorPrevisto ?? inv.valorRegistrado ?? 0,
              valorRegistrado: inv.valorRegistrado ?? 0,
              vencimentoMs: inv.vencimento?.toMillis?.() ?? 0,
            });
          }
        }),
      );
      all.sort((a, b) => a.vencimentoMs - b.vencimentoMs);
      result.value = all;
    },
    { immediate: true, deep: true },
  );

  return result;
}

export interface MonthInvoice extends OpenInvoice {
  status: StatusFatura;
  /** Quando foi paga (0 se ainda em aberto). */
  dataPagamentoMs: number;
}

/**
 * Faturas (abertas E pagas) de uma competência, de todos os cartões visíveis.
 * Permite exibir o cartão como despesa do mês mesmo depois de pago e contar o
 * pagamento como "gasto no mês". Leitura pontual (getDocs), recarrega ao mudar
 * a competência ou a lista de cartões.
 */
export function useInvoicesMonth(
  competencia: MaybeRefOrGetter<Competencia>,
): Ref<MonthInvoice[]> {
  const { wsId } = useCtxRefs();
  const cards = useCards();
  const result = ref<MonthInvoice[]>([]);

  watch(
    [cards, wsId, () => toValue(competencia), monthTick],
    async ([cardList, ws, comp]) => {
      if (!ws || !comp) {
        result.value = [];
        return;
      }
      const ativos = cardList.filter((c) => !c.arquivado && c.id);
      const all: MonthInvoice[] = [];
      await Promise.all(
        ativos.map(async (c) => {
          const snap = await getDocs(
            query(invoicesRef(ws, c.id as string), where("competencia", "==", comp)),
          );
          for (const d of snap.docs) {
            const inv = d.data();
            all.push({
              cardId: c.id as string,
              cardNome: c.nome,
              invoiceId: d.id,
              competencia: inv.competencia,
              valorPrevisto: inv.valorPrevisto ?? inv.valorRegistrado ?? 0,
              valorRegistrado: inv.valorRegistrado ?? 0,
              vencimentoMs: inv.vencimento?.toMillis?.() ?? 0,
              status: inv.status,
              dataPagamentoMs: inv.dataPagamento?.toMillis?.() ?? 0,
            });
          }
        }),
      );
      all.sort((a, b) => a.vencimentoMs - b.vencimentoMs);
      result.value = all;
    },
    { immediate: true, deep: true },
  );

  return result;
}

export interface CardBill {
  cardId: string;
  cardNome: string;
  invoiceId: string;
  competencia: Competencia;
  /** Meta de gasto (previsto). */
  valorPrevisto: number;
  /** Soma das compras = o que se paga (realizado). */
  valorRegistrado: number;
  /**
   * Soma das prestações: parte da fatura vinda de compras PARCELADAS
   * (parcelaTotal > 1). É o valor "fixo" do mês — recorre mesmo sem novas compras.
   */
  somaPrestacoes: number;
  status: StatusFatura;
  vencimentoMs: number;
  dataPagamentoMs: number;
  /** Aberta e de competência anterior à selecionada. */
  atrasada: boolean;
}

/**
 * Faturas dos cartões para o dashboard: as do mês selecionado (em aberto OU pagas),
 * cada uma com o total e a soma das prestações (parcelas de compras parceladas).
 * Leitura pontual (getDocs).
 */
export function useCardBills(
  competencia: MaybeRefOrGetter<Competencia>,
): Ref<CardBill[]> {
  const { wsId, uid } = useCtxRefs();
  const cards = useCards();
  const result = ref<CardBill[]>([]);

  watch(
    [cards, wsId, uid, () => toValue(competencia), monthTick],
    async ([cardList, ws, user, comp]) => {
      if (!ws || !comp) {
        result.value = [];
        return;
      }
      const ativos = cardList.filter((c) => !c.arquivado && c.id);
      const all: CardBill[] = [];
      await Promise.all(
        ativos.map(async (c) => {
          const cardId = c.id as string;
          // Faturas do cartão (subcoleção herda a visibilidade do cartão-pai).
          const invSnap = await getDocs(invoicesRef(ws, cardId));
          const relevantes = invSnap.docs.filter(
            (d) => d.data().competencia === comp,
          );
          if (relevantes.length === 0) return;

          // Transações do cartão (duas queries por visibilidade) para somar parcelas.
          const [snapCompart, snapMinhas] = await Promise.all([
            getDocs(
              query(
                transactionsRef(ws),
                where("cardId", "==", cardId),
                where("_visibilidade", "==", "compartilhada"),
              ),
            ),
            user
              ? getDocs(
                  query(
                    transactionsRef(ws),
                    where("cardId", "==", cardId),
                    where("_donoUid", "==", user),
                  ),
                )
              : null,
          ]);
          const txMap = new Map<string, Transaction>();
          for (const d of snapCompart.docs) txMap.set(d.id, d.data());
          if (snapMinhas) for (const d of snapMinhas.docs) txMap.set(d.id, d.data());
          const txs = [...txMap.values()];

          for (const d of relevantes) {
            const inv = d.data();
            const somaPrestacoes = txs
              .filter(
                (t) =>
                  t.competencia === inv.competencia && (t.parcelaTotal ?? 1) > 1,
              )
              .reduce((s, t) => s + (t.valor ?? 0), 0);
            all.push({
              cardId,
              cardNome: c.nome,
              invoiceId: d.id,
              competencia: inv.competencia,
              valorPrevisto: inv.valorPrevisto ?? inv.valorRegistrado ?? 0,
              valorRegistrado: inv.valorRegistrado ?? 0,
              somaPrestacoes,
              status: inv.status,
              vencimentoMs: inv.vencimento?.toMillis?.() ?? 0,
              dataPagamentoMs: inv.dataPagamento?.toMillis?.() ?? 0,
              atrasada: false,
            });
          }
        }),
      );
      all.sort((a, b) => a.vencimentoMs - b.vencimentoMs);
      result.value = all;
    },
    { immediate: true, deep: true },
  );

  return result;
}

export interface FlowTrend {
  labels: string[];
  receitas: number[];
  despesas: number[];
}

/** Rótulo curto de competência para eixo ("jul"). */
function labelCurto(c: Competencia): string {
  const { ano, mes } = parseCompetencia(c);
  return new Date(ano, mes - 1, 1)
    .toLocaleDateString("pt-BR", { month: "short" })
    .replace(".", "");
}

/**
 * Tendência de fluxo previsto (caixa) dos últimos `n` meses até a competência:
 * receitas e despesas previstas por mês (exclui compras de cartão). Apenas DUAS
 * queries de range (uma por visibilidade), agrupadas no cliente.
 */
export function useMonthlyTrend(
  competencia: MaybeRefOrGetter<Competencia>,
  n = 6,
): Ref<FlowTrend> {
  const { wsId, uid } = useCtxRefs();
  const result = ref<FlowTrend>({ labels: [], receitas: [], despesas: [] });

  watch(
    [wsId, uid, () => toValue(competencia), monthTick],
    async ([ws, user, comp]) => {
      if (!ws || !comp) {
        result.value = { labels: [], receitas: [], despesas: [] };
        return;
      }
      const meses = Array.from({ length: n }, (_, i) => addMeses(comp, -(n - 1) + i));
      const inicio = intervaloCompetencia(meses[0]).inicio;
      const fim = intervaloCompetencia(meses[n - 1]).fim;

      const [snapCompart, snapMinhas] = await Promise.all([
        getDocs(
          query(
            transactionsRef(ws),
            where("data", ">=", inicio),
            where("data", "<", fim),
            where("_visibilidade", "==", "compartilhada"),
            orderBy("data", "desc"),
          ),
        ),
        user
          ? getDocs(
              query(
                transactionsRef(ws),
                where("data", ">=", inicio),
                where("data", "<", fim),
                where("_donoUid", "==", user),
                orderBy("data", "desc"),
              ),
            )
          : null,
      ]);
      const map = new Map<string, Transaction>();
      for (const d of snapCompart.docs) map.set(d.id, d.data());
      if (snapMinhas) for (const d of snapMinhas.docs) map.set(d.id, d.data());

      const receitas = meses.map(() => 0);
      const despesas = meses.map(() => 0);
      for (const t of map.values()) {
        if (t.cardId || !t.previsto) continue; // caixa, só previsto
        const idx = meses.indexOf(competenciaDe(t.data.toDate()));
        if (idx < 0) continue;
        const v = t.valorPrevisto ?? t.valor;
        if (t.tipo === "receita") receitas[idx] += v;
        else if (t.tipo === "despesa") despesas[idx] += v;
      }
      result.value = { labels: meses.map(labelCurto), receitas, despesas };
    },
    { immediate: true, deep: true },
  );

  return result;
}

/** Fechamento de uma competência (doc id = "YYYY-MM"). */
export function useReview(competencia: MaybeRefOrGetter<Competencia>) {
  const { wsId } = useCtxRefs();
  return useDocument(
    computed(() => {
      const c = toValue(competencia);
      return wsId.value && c ? reviewRef(wsId.value, c) : null;
    }),
  );
}

/** Faturas de um cartão (subcoleção — herda visibilidade do cartão pai). */
export function useInvoices(cardId: MaybeRefOrGetter<string | null | undefined>) {
  const { wsId } = useCtxRefs();
  return useCollection(
    computed(() => {
      const id = toValue(cardId);
      return wsId.value && id ? invoicesRef(wsId.value, id) : null;
    }),
  );
}

/** Compras (transações) de um cartão, respeitando a visibilidade (duas queries). */
export function useCardTransactions(cardId: MaybeRefOrGetter<string | null | undefined>) {
  const { wsId, uid } = useCtxRefs();
  const compartilhadas = useCollection(
    computed(() => {
      const id = toValue(cardId);
      return wsId.value && id
        ? query(
            transactionsRef(wsId.value),
            where("cardId", "==", id),
            where("_visibilidade", "==", "compartilhada"),
          )
        : null;
    }),
  );
  const minhas = useCollection(
    computed(() => {
      const id = toValue(cardId);
      return wsId.value && id && uid.value
        ? query(
            transactionsRef(wsId.value),
            where("cardId", "==", id),
            where("_donoUid", "==", uid.value),
          )
        : null;
    }),
  );
  return computed(() => mergeById(compartilhadas.value, minhas.value));
}

export function useCategories() {
  const { wsId } = useCtxRefs();
  // Categorias são de nível de workspace (sem visibilidade por entidade).
  return useCollection(
    computed(() => (wsId.value ? categoriesRef(wsId.value) : null)),
  );
}

/** Transações de uma competência, respeitando a visibilidade (duas queries). */
export function useTransactionsMonth(competencia: MaybeRefOrGetter<Competencia>) {
  const { wsId, uid } = useCtxRefs();

  function monthQuery(extra: (q: Query) => Query): Query | null {
    if (!wsId.value) return null;
    const { inicio, fim } = intervaloCompetencia(toValue(competencia));
    const base = query(
      transactionsRef(wsId.value),
      where("data", ">=", inicio),
      where("data", "<", fim),
      orderBy("data", "desc"),
    );
    return extra(base);
  }

  const compartilhadas = useCollection(
    computed(() =>
      monthQuery((q) => query(q, where("_visibilidade", "==", "compartilhada"))),
    ),
  );
  const minhas = useCollection(
    computed(() =>
      uid.value ? monthQuery((q) => query(q, where("_donoUid", "==", uid.value))) : null,
    ),
  );

  return computed(() =>
    mergeById(compartilhadas.value, minhas.value).sort(
      (a, b) => b.data.toMillis() - a.data.toMillis(),
    ),
  );
}
