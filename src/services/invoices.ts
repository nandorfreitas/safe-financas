import {
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  writeBatch,
  serverTimestamp,
  increment,
  deleteField,
  limit,
} from "firebase/firestore";
import { db } from "@/firebase";
import { invoicesRef, invoiceRef, accountRef } from "@/lib/firestore";
import type { Competencia, Invoice } from "@/types/models";
import { vencimentoDe } from "@/lib/competencia";
import { ctx } from "./context";

/**
 * Garante que existe uma fatura para a competência do cartão; cria se faltar.
 * Retorna o id da fatura.
 */
export async function ensureInvoice(
  cardId: string,
  competencia: Competencia,
  diaVencimento: number,
): Promise<string> {
  const { wsId, uid } = ctx();
  const existing = await getDocs(
    query(invoicesRef(wsId, cardId), where("competencia", "==", competencia), limit(1)),
  );
  if (!existing.empty) return existing.docs[0].id;

  const data: Omit<Invoice, "id"> = {
    competencia,
    vencimento: vencimentoDe(diaVencimento, competencia),
    status: "aberta",
    valorRegistrado: 0,
    valorPrevisto: 0,
    valorPrevistoManual: false,
    criadoPor: uid,
  };
  const ref = await addDoc(invoicesRef(wsId, cardId), data as Invoice);
  return ref.id;
}

/**
 * Aplica um delta (centavos) ao valorRegistrado (realizado) de uma fatura.
 * Enquanto a meta (valorPrevisto) não foi definida à mão, ela acompanha o
 * registrado. Usado ao criar/remover compras e parcelas.
 */
export async function applyRegistradoDelta(
  cardId: string,
  invoiceId: string,
  delta: number,
): Promise<void> {
  const { wsId } = ctx();
  const ref = invoiceRef(wsId, cardId, invoiceId);
  const snap = await getDoc(ref);
  const d = snap.data();
  const manual = d?.valorPrevistoManual ?? false;
  // Recalcula (em vez de increment) para auto-curar faturas antigas sem o campo.
  const novoRegistrado = (d?.valorRegistrado ?? 0) + delta;
  const patch: Record<string, unknown> = { valorRegistrado: novoRegistrado };
  if (!manual) patch.valorPrevisto = novoRegistrado;
  await updateDoc(ref, patch);
}

/** Define a META (valorPrevisto) da fatura — o previsto que entra no orçamento. */
export async function setValorPrevisto(
  cardId: string,
  invoiceId: string,
  valorPrevisto: number,
): Promise<void> {
  const { wsId } = ctx();
  await updateDoc(invoiceRef(wsId, cardId, invoiceId), {
    valorPrevisto,
    valorPrevistoManual: true,
  });
}

/** Soma automática das compras/parcelas (somente leitura na UI). */
export async function setValorRegistrado(
  cardId: string,
  invoiceId: string,
  valorRegistrado: number,
): Promise<void> {
  const { wsId } = ctx();
  await updateDoc(invoiceRef(wsId, cardId, invoiceId), { valorRegistrado });
}

/**
 * Pagamento da fatura: NÃO é transação (anti-dupla-contagem). São duas ações
 * atômicas — o saldo da conta pagadora desce o valor pago (o valorRegistrado,
 * que é o que de fato se paga) e a fatura marca "paga".
 */
export async function pagarFatura(
  cardId: string,
  invoiceId: string,
  contaId: string,
  valor: number,
): Promise<void> {
  const { wsId } = ctx();
  const batch = writeBatch(db);
  batch.update(accountRef(wsId, contaId), { saldo: increment(-valor) });
  batch.update(invoiceRef(wsId, cardId, invoiceId), {
    status: "paga",
    pagaPorContaId: contaId,
    dataPagamento: serverTimestamp(),
  });
  await batch.commit();
}

/** Reabre uma fatura paga (desfaz pagamento), devolvendo o saldo à conta. */
export async function reabrirFatura(
  cardId: string,
  invoiceId: string,
  contaId: string,
  valor: number,
): Promise<void> {
  const { wsId } = ctx();
  const batch = writeBatch(db);
  batch.update(accountRef(wsId, contaId), { saldo: increment(valor) });
  batch.update(invoiceRef(wsId, cardId, invoiceId), {
    status: "aberta",
    pagaPorContaId: deleteField(),
    dataPagamento: deleteField(),
  });
  await batch.commit();
}
