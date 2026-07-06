import {
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  doc,
  serverTimestamp,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/firebase";
import {
  transactionsRef,
  transactionRef,
  accountRef,
  cardRef,
} from "@/lib/firestore";
import type {
  Competencia,
  Transaction,
  TipoTransacao,
  Visibilidade,
} from "@/types/models";
import { addMeses, parseCompetencia } from "@/lib/competencia";
import { merchantKey } from "@/lib/categorize";
import { ensureInvoice, applyRegistradoDelta } from "./invoices";
import { ctx } from "./context";

/** Chave de deduplicação de um lançamento importado. */
export function importHashOf(data: Date, valor: number, descricao: string): string {
  return `${data.toISOString().slice(0, 10)}|${valor}|${merchantKey(descricao)}`;
}

export interface TransactionInput {
  tipo: TipoTransacao;
  previsto: boolean;
  realizado: boolean;
  valor: number;
  valorPrevisto?: number;
  /** Vencimento / data prevista (define a competência). */
  data: Date;
  /** Data de pagamento/recebimento. Só quando realizado. */
  dataEfetivacao?: Date;
  accountId?: string;
  cardId?: string;
  categoryId?: string;
  fixa: boolean;
  essencial?: boolean;
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
    dataEfetivacao: input.dataEfetivacao
      ? Timestamp.fromDate(input.dataEfetivacao)
      : undefined,
    accountId: input.accountId,
    cardId: input.cardId,
    categoryId: input.categoryId,
    fixa: input.fixa,
    essencial: input.essencial,
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
  patch: Partial<Omit<TransactionInput, "data" | "dataEfetivacao">> & {
    data?: Date;
    /** Date para definir; null para limpar (ex.: desfez a efetivação). */
    dataEfetivacao?: Date | null;
  },
): Promise<void> {
  const { wsId } = ctx();
  const { data, dataEfetivacao, ...rest } = patch;
  const out: Record<string, unknown> = { ...rest };
  if (data) out.data = Timestamp.fromDate(data);
  if (dataEfetivacao !== undefined) {
    out.dataEfetivacao = dataEfetivacao ? Timestamp.fromDate(dataEfetivacao) : null;
  }
  await updateDoc(transactionRef(wsId, id), clean(out));
}

export async function deleteTransaction(id: string): Promise<void> {
  const { wsId } = ctx();
  await deleteDoc(transactionRef(wsId, id));
}

/**
 * Define a categoria de vários lançamentos de uma vez (categorização em lote).
 * Só grava o campo `categoryId` de cada um — não mexe em fatura/valorRegistrado
 * (a categoria não altera valores). Retorna quantos foram atualizados.
 */
export async function categorizeTransactions(
  entries: { id: string; categoryId: string }[],
): Promise<number> {
  const { wsId } = ctx();
  const validas = entries.filter((e) => e.id && e.categoryId);
  if (validas.length === 0) return 0;
  const batch = writeBatch(db);
  for (const e of validas) {
    batch.update(transactionRef(wsId, e.id), { categoryId: e.categoryId });
  }
  await batch.commit();
  return validas.length;
}

// ───────────────────────── Compras de cartão ─────────────────────────

export interface CardPurchaseInput {
  cardId: string;
  diaVencimento: number;
  /** Competência (fatura) inicial — indicada manualmente. */
  competenciaInicial: Competencia;
  /** Valor total da compra (centavos). Dividido entre as parcelas. */
  valorTotal: number;
  parcelaTotal: number;
  categoryId?: string;
  descricao: string;
  /** Dia da compra (mapeado para cada competência). */
  dataCompra: Date;
}

/** Data dentro de uma competência preservando (ao máximo) o dia da compra. */
function dataNaCompetencia(c: Competencia, dia: number): Date {
  const { ano, mes } = parseCompetencia(c);
  const ultimoDia = new Date(ano, mes, 0).getDate();
  return new Date(ano, mes - 1, Math.min(dia, ultimoDia), 12, 0, 0);
}

/** Divide um total em N parcelas (resto no último lançamento). */
function dividirParcelas(total: number, n: number): number[] {
  const base = Math.floor(total / n);
  const parcelas = Array(n).fill(base);
  parcelas[n - 1] = total - base * (n - 1);
  return parcelas;
}

/**
 * Cria uma compra de cartão. Se parcelada (parcelaTotal > 1), gera N lançamentos
 * nas competências seguintes a partir da inicial, cada um na sua fatura, todos
 * compartilhando `compraId`. Atualiza valorRegistrado de cada fatura afetada.
 * Retorna o compraId.
 */
export async function createCardPurchase(input: CardPurchaseInput): Promise<string> {
  const { wsId, uid } = ctx();
  const origem = await resolveOrigem(wsId, uid, undefined, input.cardId);
  const n = Math.max(1, input.parcelaTotal);
  const valores = dividirParcelas(input.valorTotal, n);
  const compraId = doc(transactionsRef(wsId)).id;
  const dia = input.dataCompra.getDate();

  for (let i = 0; i < n; i++) {
    const competencia = addMeses(input.competenciaInicial, i);
    const invoiceId = await ensureInvoice(input.cardId, competencia, input.diaVencimento);
    const valor = valores[i];

    const data = clean({
      tipo: "despesa" as TipoTransacao,
      // Compra de cartão não pesa no caixa até o pagamento da fatura;
      // o que entra no orçamento é o pagamento. Marcamos como realizada
      // (aconteceu) e não-prevista no caixa.
      previsto: false,
      realizado: true,
      valor,
      data: Timestamp.fromDate(dataNaCompetencia(competencia, dia)),
      cardId: input.cardId,
      categoryId: input.categoryId,
      fixa: false,
      competencia,
      invoiceId,
      descricao:
        n > 1 ? `${input.descricao} (${i + 1}/${n})` : input.descricao,
      compraId,
      parcelaNum: i + 1,
      parcelaTotal: n,
      criadoPor: uid,
      createdAt: serverTimestamp(),
      ...origem,
    });

    await addDoc(transactionsRef(wsId), data as unknown as Transaction);
    await applyRegistradoDelta(input.cardId, invoiceId, valor);
  }

  return compraId;
}

/**
 * Lança um CRÉDITO/ESTORNO na fatura (ex.: cashback, estorno de compra,
 * devolução). É uma transação de cartão com `valor` NEGATIVO — abate o
 * valorRegistrado da fatura, encaixando nos mesmos cálculos das compras.
 * Retorna o id da transação criada.
 */
export async function createCardCredit(input: {
  cardId: string;
  diaVencimento: number;
  competencia: Competencia;
  /** Centavos, positivo — lançado como abatimento (negativo) na fatura. */
  valor: number;
  descricao: string;
  categoryId?: string;
  /** Data do crédito. */
  data: Date;
}): Promise<string> {
  const { wsId, uid } = ctx();
  const origem = await resolveOrigem(wsId, uid, undefined, input.cardId);
  const invoiceId = await ensureInvoice(
    input.cardId,
    input.competencia,
    input.diaVencimento,
  );
  const valor = -Math.abs(input.valor);

  const data = clean({
    tipo: "despesa" as TipoTransacao,
    previsto: false,
    realizado: true,
    valor,
    data: Timestamp.fromDate(input.data),
    cardId: input.cardId,
    categoryId: input.categoryId,
    fixa: false,
    competencia: input.competencia,
    invoiceId,
    descricao: input.descricao,
    criadoPor: uid,
    createdAt: serverTimestamp(),
    ...origem,
  });

  const ref = await addDoc(transactionsRef(wsId), data as unknown as Transaction);
  await applyRegistradoDelta(input.cardId, invoiceId, valor);
  return ref.id;
}

// ───────────────────────── Import de fatura (CSV) ─────────────────────────

export interface ImportRow {
  data: Date;
  descricao: string;
  /** Centavos, positivo (valor da despesa). */
  valor: number;
  categoryId?: string;
  parcelaNum?: number;
  parcelaTotal?: number;
}

/**
 * Importa vários lançamentos de uma vez na fatura da competência (compras 1x).
 * Grava `importHash` em cada um (dedup) e aplica um único delta no valorRegistrado.
 * Se `remover` for informado, apaga esses lançamentos antes (modo "substituir"),
 * descontando o valor deles do delta. Retorna quantos lançamentos foram criados.
 */
export async function importCardPurchases(params: {
  cardId: string;
  diaVencimento: number;
  competencia: Competencia;
  rows: ImportRow[];
  /** Compras existentes a substituir (id + valor), para reescrever a fatura. */
  remover?: { id: string; valor: number }[];
}): Promise<number> {
  const { wsId, uid } = ctx();
  const remover = params.remover ?? [];
  if (params.rows.length === 0 && remover.length === 0) return 0;
  const origem = await resolveOrigem(wsId, uid, undefined, params.cardId);
  const invoiceId = await ensureInvoice(
    params.cardId,
    params.competencia,
    params.diaVencimento,
  );

  const batch = writeBatch(db);
  let delta = 0;

  // Remove as compras existentes (modo substituir).
  for (const rem of remover) {
    batch.delete(transactionRef(wsId, rem.id));
    delta -= rem.valor;
  }

  for (const r of params.rows) {
    const ref = doc(transactionsRef(wsId));
    const data = clean({
      tipo: "despesa" as TipoTransacao,
      previsto: false,
      realizado: true,
      valor: r.valor,
      data: Timestamp.fromDate(r.data),
      cardId: params.cardId,
      categoryId: r.categoryId || undefined,
      competencia: params.competencia,
      invoiceId,
      fixa: false,
      descricao: r.descricao,
      parcelaNum: r.parcelaNum,
      parcelaTotal: r.parcelaTotal,
      importHash: importHashOf(r.data, r.valor, r.descricao),
      criadoPor: uid,
      createdAt: serverTimestamp(),
      ...origem,
    });
    batch.set(ref, data as unknown as Transaction);
    delta += r.valor;
  }
  await batch.commit();
  await applyRegistradoDelta(params.cardId, invoiceId, delta);
  return params.rows.length;
}

/** Remove uma compra de cartão e desfaz seu efeito no valorRegistrado da fatura. */
export async function deleteCardPurchase(tx: Transaction): Promise<void> {
  const { wsId } = ctx();
  if (!tx.id) return;
  if (tx.cardId && tx.invoiceId) {
    await applyRegistradoDelta(tx.cardId, tx.invoiceId, -tx.valor);
  }
  await deleteDoc(transactionRef(wsId, tx.id));
}
