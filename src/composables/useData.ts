/**
 * Composables reativos (VueFire) escopados no workspace ativo.
 * Devem ser chamados dentro de setup().
 *
 * IMPORTANTE — "regras não são filtros": o Firestore só permite uma query de
 * `list` se as restrições garantirem que todo doc retornado passa na Security
 * Rule. Como a visibilidade é um OR ("compartilhada" OU dono == eu), cada lista
 * é feita em DUAS queries (uma por disjunto) e mesclada por id no cliente.
 */
import { computed, type MaybeRefOrGetter, toValue } from "vue";
import { useCollection } from "vuefire";
import { query, where, orderBy, type Query } from "firebase/firestore";
import { storeToRefs } from "pinia";
import {
  accountsRef,
  cardsRef,
  categoriesRef,
  transactionsRef,
} from "@/lib/firestore";
import { intervaloCompetencia } from "@/lib/competencia";
import { useWorkspaceStore } from "@/stores/workspace";
import { useAuthStore } from "@/stores/auth";
import type { Competencia } from "@/types/models";

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
