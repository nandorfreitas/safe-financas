import {
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import {
  transactionsRef,
  transactionRef,
  accountRef,
  cardRef,
} from "@/lib/firestore";
import type { Transaction, TipoTransacao, Visibilidade } from "@/types/models";
import { ctx } from "./context";

export interface TransactionInput {
  tipo: TipoTransacao;
  previsto: boolean;
  realizado: boolean;
  valor: number;
  valorPrevisto?: number;
  data: Date;
  accountId?: string;
  cardId?: string;
  categoryId?: string;
  fixa: boolean;
  competencia?: string;
  invoiceId?: string;
  descricao: string;
}

/** Lê visibilidade/dono da entidade-raiz (conta ou cartão) para denormalizar. */
async function resolveOrigem(
  wsId: string,
  fallbackUid: string,
  accountId?: string,
  cardId?: string,
): Promise<{ _donoUid: string; _visibilidade: Visibilidade }> {
  if (accountId) {
    const snap = await getDoc(accountRef(wsId, accountId));
    const d = snap.data();
    if (d) return { _donoUid: d.donoUid, _visibilidade: d.visibilidade };
  }
  if (cardId) {
    const snap = await getDoc(cardRef(wsId, cardId));
    const d = snap.data();
    if (d) return { _donoUid: d.donoUid, _visibilidade: d.visibilidade };
  }
  // Sem entidade-raiz: pertence só ao autor.
  return { _donoUid: fallbackUid, _visibilidade: "pessoal" };
}

/** Remove chaves undefined (Firestore rejeita undefined). */
function clean<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as T;
}

export async function createTransaction(input: TransactionInput): Promise<string> {
  const { wsId, uid } = ctx();
  const origem = await resolveOrigem(wsId, uid, input.accountId, input.cardId);

  const data = clean({
    tipo: input.tipo,
    previsto: input.previsto,
    realizado: input.realizado,
    valor: input.valor,
    valorPrevisto: input.valorPrevisto,
    data: Timestamp.fromDate(input.data),
    accountId: input.accountId,
    cardId: input.cardId,
    categoryId: input.categoryId,
    fixa: input.fixa,
    competencia: input.competencia,
    invoiceId: input.invoiceId,
    descricao: input.descricao,
    criadoPor: uid,
    createdAt: serverTimestamp(),
    ...origem,
  });

  const ref = await addDoc(transactionsRef(wsId), data as unknown as Transaction);
  return ref.id;
}

export async function updateTransaction(
  id: string,
  patch: Partial<Omit<TransactionInput, "data">> & { data?: Date },
): Promise<void> {
  const { wsId } = ctx();
  const { data, ...rest } = patch;
  const out: Record<string, unknown> = { ...rest };
  if (data) out.data = Timestamp.fromDate(data);
  await updateDoc(transactionRef(wsId, id), clean(out));
}

export async function deleteTransaction(id: string): Promise<void> {
  const { wsId } = ctx();
  await deleteDoc(transactionRef(wsId, id));
}
