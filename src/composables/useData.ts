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
  reviewRef,
  transactionsRef,
} from "@/lib/firestore";
import { intervaloCompetencia } from "@/lib/competencia";
import { useWorkspaceStore } from "@/stores/workspace";
import { useAuthStore } from "@/stores/auth";
import type { Competencia, StatusFatura } from "@/types/models";

function useCtxRefs() {
  const { activeId } = storeToRefs(useWorkspaceStore());
  const { uid } = storeToRefs(useAuthStore());
  return { wsId: activeId, uid };
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

export interface OpenInvoice {
  cardId: string;
  cardNome: string;
  invoiceId: string;
  competencia: Competencia;
  valorFinal: number;
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
              valorFinal: inv.valorFinal,
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
    [cards, wsId, () => toValue(competencia)],
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
              valorFinal: inv.valorFinal,
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
