import { setDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { reviewRef } from "@/lib/firestore";
import type { Competencia, ReviewEvento } from "@/types/models";
import { ctx } from "./context";

export interface ReviewInput {
  /** Snapshot do orçamento no fechamento (centavos). */
  previstoTotal: number;
  realizadoTotal: number;
  divergencia: number;
  observacao: string;
  /** Anotações puras — NÃO somam no realizado. */
  eventos: ReviewEvento[];
}

/**
 * Salva (cria ou atualiza) o fechamento de uma competência.
 * O id do documento é a própria competência ("YYYY-MM").
 */
export async function saveReview(
  competencia: Competencia,
  input: ReviewInput,
): Promise<void> {
  const { wsId, uid } = ctx();
  await setDoc(reviewRef(wsId, competencia), {
    previstoTotal: input.previstoTotal,
    realizadoTotal: input.realizadoTotal,
    divergencia: input.divergencia,
    observacao: input.observacao,
    eventos: input.eventos,
    fechadoEm: serverTimestamp(),
    fechadoPor: uid,
  });
}

/** Cria um evento-anotação com a data atual. */
export function novoEvento(descricao: string, valor: number): ReviewEvento {
  return { descricao, valor, data: Timestamp.now() };
}
