/**
 * Empréstimos — valores a PAGAR (tipo "despesa") ou a RECEBER (tipo "receita").
 *
 * Diferente do cartão (que entra no orçamento via fatura), cada prestação de
 * empréstimo é uma TRANSAÇÃO de caixa comum (previsto=true, realizado=false),
 * por isso entra normalmente no cálculo de previsto/efetivo (useBudget). O
 * empréstimo em si é só o agrupador/metadado; o gerenciamento (efetivar, desfazer)
 * acontece sobre as prestações.
 *
 * O número de prestações dita em quantos meses o empréstimo aparece: geramos N
 * transações, uma por competência a partir do 1º vencimento, todas vinculadas
 * pelo `loanId`.
 */
import {
  deleteField,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/firebase";
import {
  loanRef,
  loansRef,
  transactionsRef,
  transactionRef,
} from "@/lib/firestore";
import type { Loan, TipoTransacao, Transaction, Visibilidade } from "@/types/models";
import { addMeses, competenciaDe, parseCompetencia } from "@/lib/competencia";
import { ensureCategory } from "./categories";
import { ctx } from "./context";

/** Nome da categoria automática das prestações de empréstimo. */
export const LOAN_CATEGORY_NAME = "Empréstimos";

export interface LoanInput {
  descricao: string;
  /** "despesa" = a pagar; "receita" = a receber. */
  tipo: TipoTransacao;
  /** Centavos. Valor de cada prestação. */
  valorParcela: number;
  parcelas: number;
  /** Despesa essencial — só faz sentido para "a pagar" (despesa). */
  essencial?: boolean;
  /** Categoria das prestações; se vazia, usa a categoria padrão "Empréstimos". */
  categoryId?: string;
  /** Vencimento da 1ª prestação. */
  primeiroVencimento: Date;
  contraparte?: string;
  visibilidade: Visibilidade;
}

/** Remove chaves undefined (Firestore rejeita undefined). */
function clean<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as T;
}

/** Data dentro de uma competência preservando (ao máximo) o dia do vencimento. */
function dataNaCompetencia(c: string, dia: number): Date {
  const { ano, mes } = parseCompetencia(c);
  const ultimoDia = new Date(ano, mes, 0).getDate();
  return new Date(ano, mes - 1, Math.min(dia, ultimoDia), 12, 0, 0);
}

/**
 * Cria um empréstimo e gera suas N prestações (transações previsto/realizado),
 * uma por competência a partir do 1º vencimento, todas com o mesmo `loanId`.
 * Tudo num único batch (atômico). Retorna o loanId.
 */
export async function createLoan(input: LoanInput): Promise<string> {
  const { wsId, uid } = ctx();
  const n = Math.max(1, Math.floor(input.parcelas));
  const dia = input.primeiroVencimento.getDate();
  const competenciaInicial = competenciaDe(input.primeiroVencimento);

  // Categoria escolhida; se nenhuma, usa a padrão "Empréstimos" (cria se preciso).
  const categoryId =
    input.categoryId || (await ensureCategory(LOAN_CATEGORY_NAME, input.tipo));
  // "essencial" só se aplica a despesas (a pagar).
  const essencial = input.tipo === "despesa" ? !!input.essencial : undefined;

  const batch = writeBatch(db);
  const loanDoc = doc(loansRef(wsId));

  const loan: Omit<Loan, "id"> = clean({
    descricao: input.descricao,
    tipo: input.tipo,
    valorParcela: input.valorParcela,
    parcelas: n,
    essencial,
    categoryId,
    primeiroVencimento: Timestamp.fromDate(input.primeiroVencimento),
    contraparte: input.contraparte || undefined,
    donoUid: uid,
    visibilidade: input.visibilidade,
    arquivado: false,
    criadoPor: uid,
    createdAt: serverTimestamp() as unknown as Timestamp,
  }) as Omit<Loan, "id">;
  batch.set(loanDoc, loan as Loan);

  for (let i = 0; i < n; i++) {
    const competencia = addMeses(competenciaInicial, i);
    const txDoc = doc(transactionsRef(wsId));
    const tx = clean({
      tipo: input.tipo,
      previsto: true,
      realizado: false,
      valor: input.valorParcela,
      valorPrevisto: input.valorParcela,
      data: Timestamp.fromDate(dataNaCompetencia(competencia, dia)),
      categoryId,
      loanId: loanDoc.id,
      parcelaNum: i + 1,
      parcelaTotal: n,
      // Prestação a pagar é uma despesa fixa (recorrente). O próprio empréstimo
      // já gera os meses seguintes, então fica fora do "copiar fixas".
      fixa: input.tipo === "despesa",
      essencial,
      descricao: `${input.descricao} (${i + 1}/${n})`,
      criadoPor: uid,
      createdAt: serverTimestamp(),
      _donoUid: uid,
      _visibilidade: input.visibilidade,
    });
    batch.set(txDoc, tx as unknown as Transaction);
  }

  await batch.commit();
  return loanDoc.id;
}

/** Busca todas as prestações de um empréstimo (padrão de DUAS queries). */
async function fetchLoanTransactions(
  wsId: string,
  uid: string,
  loanId: string,
): Promise<Transaction[]> {
  const [compartilhadas, minhas] = await Promise.all([
    getDocs(
      query(
        transactionsRef(wsId),
        where("loanId", "==", loanId),
        where("_visibilidade", "==", "compartilhada"),
      ),
    ),
    getDocs(
      query(
        transactionsRef(wsId),
        where("loanId", "==", loanId),
        where("_donoUid", "==", uid),
      ),
    ),
  ]);
  const map = new Map<string, Transaction>();
  for (const d of [...compartilhadas.docs, ...minhas.docs]) {
    map.set(d.id, d.data());
  }
  return [...map.values()];
}

/**
 * Atualiza metadados do empréstimo (nome, contraparte, visibilidade) e propaga
 * para as prestações o que precisa ficar coerente (descrição com sufixo i/N e a
 * visibilidade denormalizada). Valor/parcelas/direção são imutáveis pós-criação.
 */
export async function updateLoan(
  id: string,
  patch: {
    descricao?: string;
    contraparte?: string | null;
    visibilidade?: Visibilidade;
    essencial?: boolean;
    /** Categoria; "" ou null volta para a categoria padrão "Empréstimos". */
    categoryId?: string | null;
  },
): Promise<void> {
  const { wsId, uid } = ctx();

  const loanPatch: Record<string, unknown> = {};
  if (patch.descricao !== undefined) loanPatch.descricao = patch.descricao;
  if (patch.visibilidade !== undefined) loanPatch.visibilidade = patch.visibilidade;
  if (patch.essencial !== undefined) loanPatch.essencial = patch.essencial;
  // null → limpa o campo; string vazia também limpa.
  if (patch.contraparte !== undefined) {
    loanPatch.contraparte = patch.contraparte ? patch.contraparte : deleteField();
  }

  // Categoria efetiva: a escolhida, ou a padrão "Empréstimos" se vazia.
  let categoriaEfetiva: string | undefined;
  if (patch.categoryId !== undefined) {
    if (patch.categoryId) {
      categoriaEfetiva = patch.categoryId;
    } else {
      const snap = await getDoc(loanRef(wsId, id));
      categoriaEfetiva = await ensureCategory(
        LOAN_CATEGORY_NAME,
        snap.data()?.tipo ?? "despesa",
      );
    }
    loanPatch.categoryId = categoriaEfetiva;
  }

  await updateDoc(loanRef(wsId, id), loanPatch);

  const precisaPropagar =
    patch.descricao !== undefined ||
    patch.visibilidade !== undefined ||
    patch.essencial !== undefined ||
    patch.categoryId !== undefined;
  if (!precisaPropagar) return;

  const txs = await fetchLoanTransactions(wsId, uid, id);
  if (txs.length === 0) return;
  const batch = writeBatch(db);
  for (const t of txs) {
    if (!t.id) continue;
    const p: Record<string, unknown> = {};
    if (patch.visibilidade !== undefined) p._visibilidade = patch.visibilidade;
    if (patch.essencial !== undefined) p.essencial = patch.essencial;
    if (patch.categoryId !== undefined) p.categoryId = categoriaEfetiva;
    if (patch.descricao !== undefined) {
      const total = t.parcelaTotal ?? txs.length;
      p.descricao = `${patch.descricao} (${t.parcelaNum ?? 1}/${total})`;
    }
    batch.update(transactionRef(wsId, t.id), p);
  }
  await batch.commit();
}

export async function setLoanArchived(id: string, arquivado: boolean): Promise<void> {
  const { wsId } = ctx();
  await updateDoc(loanRef(wsId, id), { arquivado });
}

/**
 * Backfill: marca como fixas (recorrentes) as prestações dos empréstimos
 * informados que ainda não estão. Retorna quantas prestações foram atualizadas.
 * Usado para empréstimos criados antes de prestação virar despesa fixa.
 */
export async function backfillLoansFixa(loanIds: string[]): Promise<number> {
  const { wsId, uid } = ctx();
  let total = 0;
  for (const id of loanIds) {
    const txs = await fetchLoanTransactions(wsId, uid, id);
    const pendentes = txs.filter((t) => t.id && !t.fixa);
    if (pendentes.length === 0) continue;
    const batch = writeBatch(db);
    for (const t of pendentes) {
      batch.update(transactionRef(wsId, t.id as string), { fixa: true });
    }
    await batch.commit();
    total += pendentes.length;
  }
  return total;
}

/** Exclui o empréstimo e TODAS as suas prestações (atômico). */
export async function deleteLoan(id: string): Promise<void> {
  const { wsId, uid } = ctx();
  const txs = await fetchLoanTransactions(wsId, uid, id);
  const batch = writeBatch(db);
  for (const t of txs) {
    if (t.id) batch.delete(transactionRef(wsId, t.id));
  }
  batch.delete(loanRef(wsId, id));
  await batch.commit();
}
