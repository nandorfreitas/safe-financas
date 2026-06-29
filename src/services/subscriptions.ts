/**
 * Assinaturas — despesas fixas (não essenciais) recorrentes, associadas a um
 * cartão de crédito. Cada mês, a cobrança é materializada como uma TRANSAÇÃO de
 * cartão na fatura daquele mês (mesmo pipeline das compras), então entra na
 * fatura e em todos os cálculos que já consomem faturas, sem casos especiais.
 *
 * Recorrência: materialização automática "ao abrir o mês" via
 * `ensureSubscriptionCharges(competencia)`. É idempotente — usa um id
 * determinístico `sub_{subscriptionId}_{competencia}`, então nunca duplica.
 */
import {
  addDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/firebase";
import {
  cardRef,
  subscriptionRef,
  subscriptionsRef,
  transactionsRef,
  transactionRef,
} from "@/lib/firestore";
import type {
  Competencia,
  Subscription,
  TipoTransacao,
  Transaction,
} from "@/types/models";
import { competenciaDe, vencimentoDe } from "@/lib/competencia";
import { ensureInvoice, applyRegistradoDelta } from "./invoices";
import { ctx } from "./context";

export interface SubscriptionInput {
  descricao: string;
  /** Centavos. Valor mensal. */
  valor: number;
  cardId: string;
  categoryId?: string;
}

/** Remove chaves undefined (Firestore rejeita undefined). */
function clean<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as T;
}

/** Assinaturas ativas visíveis (padrão de DUAS queries por visibilidade). */
async function fetchActiveSubscriptions(
  wsId: string,
  uid: string,
): Promise<Subscription[]> {
  const [compart, minhas] = await Promise.all([
    getDocs(query(subscriptionsRef(wsId), where("visibilidade", "==", "compartilhada"))),
    getDocs(query(subscriptionsRef(wsId), where("donoUid", "==", uid))),
  ]);
  const map = new Map<string, Subscription>();
  for (const d of [...compart.docs, ...minhas.docs]) map.set(d.id, d.data());
  return [...map.values()].filter((s) => s.ativa && !s.arquivado);
}

/** Cobranças (transações) materializadas de uma assinatura (DUAS queries). */
async function fetchSubscriptionCharges(
  wsId: string,
  uid: string,
  subscriptionId: string,
): Promise<Transaction[]> {
  const [compart, minhas] = await Promise.all([
    getDocs(
      query(
        transactionsRef(wsId),
        where("subscriptionId", "==", subscriptionId),
        where("_visibilidade", "==", "compartilhada"),
      ),
    ),
    getDocs(
      query(
        transactionsRef(wsId),
        where("subscriptionId", "==", subscriptionId),
        where("_donoUid", "==", uid),
      ),
    ),
  ]);
  const map = new Map<string, Transaction>();
  for (const d of [...compart.docs, ...minhas.docs]) map.set(d.id, d.data());
  return [...map.values()];
}

export async function createSubscription(input: SubscriptionInput): Promise<string> {
  const { wsId, uid } = ctx();
  const cardSnap = await getDoc(cardRef(wsId, input.cardId));
  const card = cardSnap.data();
  if (!card) throw new Error("Cartão não encontrado.");

  const inicio = competenciaDe();
  const sub = clean({
    descricao: input.descricao,
    valor: input.valor,
    cardId: input.cardId,
    categoryId: input.categoryId,
    inicioCompetencia: inicio,
    ativa: true,
    donoUid: uid, // autor (a regra de create exige donoUid == auth.uid)
    visibilidade: card.visibilidade, // herda do cartão
    arquivado: false,
    criadoPor: uid,
    createdAt: serverTimestamp(),
  });
  const ref = await addDoc(subscriptionsRef(wsId), sub as unknown as Subscription);

  // Tenta já materializar a cobrança do mês atual, mas SEM derrubar a criação:
  // a materialização é idempotente e roda de novo ao abrir o mês (dashboard/cartão).
  try {
    await ensureSubscriptionCharges(inicio);
  } catch (e) {
    console.error("Falha ao materializar a cobrança da assinatura (será refeita ao abrir o mês):", e);
  }
  return ref.id;
}

/**
 * Garante (idempotente) a cobrança de cada assinatura ativa na fatura do mês.
 * Retorna quantas cobranças foram criadas. Chamada "ao abrir o mês".
 */
export async function ensureSubscriptionCharges(
  competencia: Competencia,
): Promise<number> {
  const { wsId, uid } = ctx();
  const subs = await fetchActiveSubscriptions(wsId, uid);
  let criadas = 0;

  for (const s of subs) {
    if (!s.id || !s.cardId) continue;
    if (competencia < s.inicioCompetencia) continue; // não retroage antes do início

    const txId = `sub_${s.id}_${competencia}`;
    const ref = doc(transactionsRef(wsId), txId);
    const existing = await getDoc(ref);
    if (existing.exists()) continue;

    const cardSnap = await getDoc(cardRef(wsId, s.cardId));
    const card = cardSnap.data();
    if (!card) continue;

    const invoiceId = await ensureInvoice(s.cardId, competencia, card.diaVencimento);
    const data = clean({
      tipo: "despesa" as TipoTransacao,
      // Igual à compra de cartão: entra no orçamento via a FATURA, não no caixa.
      previsto: false,
      realizado: true,
      valor: s.valor,
      data: vencimentoDe(card.diaVencimento, competencia),
      cardId: s.cardId,
      categoryId: s.categoryId,
      fixa: true,
      essencial: false,
      competencia,
      invoiceId,
      subscriptionId: s.id,
      descricao: s.descricao,
      criadoPor: uid,
      createdAt: serverTimestamp(),
      _donoUid: card.donoUid,
      _visibilidade: card.visibilidade,
    });
    await setDoc(ref, data as unknown as Transaction);
    await applyRegistradoDelta(s.cardId, invoiceId, s.valor);
    criadas++;
  }
  return criadas;
}

/**
 * Atualiza metadados (descrição/categoria/ativa) e propaga descrição/categoria
 * às cobranças já materializadas. Valor e cartão são imutáveis pós-criação
 * (para mudá-los, exclua e recrie — evita reescrever faturas passadas).
 */
export async function updateSubscription(
  id: string,
  patch: { descricao?: string; categoryId?: string | null; ativa?: boolean },
): Promise<void> {
  const { wsId, uid } = ctx();

  const subPatch: Record<string, unknown> = {};
  if (patch.descricao !== undefined) subPatch.descricao = patch.descricao;
  if (patch.ativa !== undefined) subPatch.ativa = patch.ativa;
  if (patch.categoryId !== undefined) {
    subPatch.categoryId = patch.categoryId ? patch.categoryId : deleteField();
  }
  await updateDoc(subscriptionRef(wsId, id), subPatch);

  if (patch.descricao === undefined && patch.categoryId === undefined) return;

  const charges = await fetchSubscriptionCharges(wsId, uid, id);
  if (charges.length === 0) return;
  const batch = writeBatch(db);
  for (const t of charges) {
    if (!t.id) continue;
    const p: Record<string, unknown> = {};
    if (patch.descricao !== undefined) p.descricao = patch.descricao;
    if (patch.categoryId !== undefined) {
      p.categoryId = patch.categoryId ? patch.categoryId : deleteField();
    }
    batch.update(transactionRef(wsId, t.id), p);
  }
  await batch.commit();
}

export async function setSubscriptionActive(id: string, ativa: boolean): Promise<void> {
  const { wsId } = ctx();
  await updateDoc(subscriptionRef(wsId, id), { ativa });
}

/**
 * Exclui a assinatura e TODAS as cobranças materializadas, revertendo o
 * valorRegistrado das faturas afetadas (mesma lógica de remover compra de cartão).
 */
export async function deleteSubscription(id: string): Promise<void> {
  const { wsId, uid } = ctx();
  const charges = await fetchSubscriptionCharges(wsId, uid, id);
  for (const t of charges) {
    if (t.cardId && t.invoiceId) {
      await applyRegistradoDelta(t.cardId, t.invoiceId, -t.valor);
    }
  }
  const batch = writeBatch(db);
  for (const t of charges) if (t.id) batch.delete(transactionRef(wsId, t.id));
  batch.delete(subscriptionRef(wsId, id));
  await batch.commit();
}
