import {
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
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
import { ensureInvoice, applyRegistradoDelta } from "./invoices";
import { ctx } from "./context";

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

/** Remove uma compra de cartão e desfaz seu efeito no valorRegistrado da fatura. */
export async function deleteCardPurchase(tx: Transaction): Promise<void> {
  const { wsId } = ctx();
  if (!tx.id) return;
  if (tx.cardId && tx.invoiceId) {
    await applyRegistradoDelta(tx.cardId, tx.invoiceId, -tx.valor);
  }
  await deleteDoc(transactionRef(wsId, tx.id));
}
