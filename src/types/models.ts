/**
 * Modelo de dados do Firestore — Fase 1.
 * Espelha a seção 10 do escopo (escopo-gestao-financeira.md).
 *
 * Convenções:
 * - Todo valor monetário é `number` em CENTAVOS inteiros.
 * - Datas persistidas são `Timestamp` do Firestore; aqui usamos o tipo importado.
 * - Campos prefixados com `_` são denormalizações para uso nas Security Rules.
 */
import type { Timestamp } from "firebase/firestore";

export type Visibilidade = "pessoal" | "compartilhada";
export type TipoConta = "conta" | "investimento";
export type TipoCategoria = "receita" | "despesa";
export type TipoTransacao = "receita" | "despesa";
export type StatusFatura = "aberta" | "paga";
export type MemberRole = "owner" | "member";

/** Competência no formato "YYYY-MM" (ex.: "2026-06"). */
export type Competencia = string;

export interface Member {
  role: MemberRole;
  nome: string;
}

export interface Workspace {
  id?: string;
  name: string;
  ownerUid: string;
  /** Usado nas Security Rules via array-contains. */
  memberUids: string[];
  /** Denormalizado para a UI. */
  members: Record<string, Member>;
  /** Limiar de divergência para o fechamento de mês (fração, ex.: 0.20). */
  limiarDivergencia: number;
  createdAt: Timestamp;
}

export interface Account {
  id?: string;
  nome: string;
  tipo: TipoConta;
  /** Centavos. Manual — fonte da verdade. */
  saldo: number;
  /** Fixo na criação, nunca muda. */
  donoUid: string;
  visibilidade: Visibilidade;
  /** Só para tipo "investimento". */
  instituicao?: string;
  tipoInvest?: string;
  arquivada: boolean;
}

export interface Card {
  id?: string;
  nome: string;
  /** Centavos. */
  limite?: number;
  diaVencimento: number;
  bandeira?: string;
  donoUid: string;
  visibilidade: Visibilidade;
  arquivado: boolean;
}

export interface Invoice {
  id?: string;
  competencia: Competencia;
  /** Derivado de diaVencimento + competencia. */
  vencimento: Timestamp;
  status: StatusFatura;
  /** Soma automática das compras/parcelas = REALIZADO (o que se paga). */
  valorRegistrado: number;
  /** Meta de gasto no cartão = PREVISTO. Acompanha o registrado até ser editada. */
  valorPrevisto: number;
  /** Se true, valorPrevisto (meta) foi definido à mão e não acompanha o registrado. */
  valorPrevistoManual?: boolean;
  /** Conta que quitou a fatura. */
  pagaPorContaId?: string;
  dataPagamento?: Timestamp;
  criadoPor: string;
}

export interface Loan {
  id?: string;
  /** Descrição do empréstimo (ex.: "Financiamento do carro"). */
  descricao: string;
  /**
   * Direção do empréstimo:
   * - "despesa" = a PAGAR (dinheiro que devo).
   * - "receita" = a RECEBER (emprestei e vão me pagar).
   * Mapeia direto para o `tipo` das transações geradas.
   */
  tipo: TipoTransacao;
  /** Centavos. Valor de CADA prestação (o total é valorParcela × parcelas). */
  valorParcela: number;
  /** Número de prestações — dita em quantos meses o empréstimo aparece. */
  parcelas: number;
  /** Despesa essencial (mínimo para viver) — entra no % da receita. Só "a pagar". */
  essencial?: boolean;
  /** Categoria das prestações (ex.: Moradia, Transporte). */
  categoryId?: string;
  /** Vencimento da 1ª prestação. As demais caem nos meses seguintes. */
  primeiroVencimento: Timestamp;
  /** Contraparte opcional (banco, pessoa). */
  contraparte?: string;
  donoUid: string;
  visibilidade: Visibilidade;
  arquivado: boolean;
  criadoPor: string;
  createdAt: Timestamp;
}

export interface Subscription {
  id?: string;
  descricao: string;
  /** Centavos. Valor mensal. */
  valor: number;
  /** Cartão de crédito associado — a cobrança entra na fatura deste cartão. */
  cardId: string;
  categoryId?: string;
  /** Competência inicial "YYYY-MM" — não materializa cobrança antes disso. */
  inicioCompetencia: Competencia;
  /** Ativa? false = pausada/cancelada (não gera novas cobranças). */
  ativa: boolean;
  /** donoUid = autor; visibilidade copiada do cartão (para listar por visibilidade). */
  donoUid: string;
  visibilidade: Visibilidade;
  arquivado: boolean;
  criadoPor: string;
  createdAt: Timestamp;
}

export interface Category {
  id?: string;
  nome: string;
  tipo: TipoCategoria;
  cor: string;
  /** Default: lançamentos desta categoria repetem nos próximos meses. */
  fixaPorPadrao: boolean;
  /** Default: despesa essencial (mínimo para viver) — entra no % da receita. */
  essencialPorPadrao: boolean;
  arquivada: boolean;
}

export interface Transaction {
  id?: string;
  tipo: TipoTransacao;
  /** Entra no orçamento previsto? */
  previsto: boolean;
  /** De fato aconteceu? */
  realizado: boolean;
  /** Centavos, positivo. Valor efetivo. */
  valor: number;
  /** Centavos. Quanto se esperava (desvio item a item). Opcional. */
  valorPrevisto?: number;
  /** Data de vencimento / prevista. Define a competência (mês) do lançamento. */
  data: Timestamp;
  /** Data em que foi pago/recebido. Só quando realizado. */
  dataEfetivacao?: Timestamp;
  /** Conta de origem (despesa/receita comum). */
  accountId?: string;
  /** Se for compra de cartão. */
  cardId?: string;
  categoryId?: string;
  /** Recorrente: repete nos próximos meses (o valor pode variar). Despesa ou receita. */
  fixa: boolean;
  /** Essencial: mínimo para viver — entra no % da receita. Só despesa. */
  essencial?: boolean;
  /** Só compra de cartão — define a fatura. */
  competencia?: Competencia;
  invoiceId?: string;
  /** Se for prestação de empréstimo — vincula ao empréstimo-pai. */
  loanId?: string;
  /** Se for cobrança de assinatura — vincula à assinatura-pai. */
  subscriptionId?: string;
  /** Parcelamento. */
  compraId?: string;
  parcelaNum?: number;
  parcelaTotal?: number;
  descricao: string;
  /** Autoria. */
  criadoPor: string;
  createdAt: Timestamp;
  /** Denormalizado da entidade-raiz para as Security Rules. */
  _donoUid: string;
  _visibilidade: Visibilidade;
}

export interface ReviewEvento {
  descricao: string;
  /** Centavos. Anotação pura — não soma no realizado. */
  valor: number;
  data: Timestamp;
}

export interface MonthlyReview {
  /** id do doc = competência "YYYY-MM". */
  id?: Competencia;
  previstoTotal: number;
  realizadoTotal: number;
  divergencia: number;
  observacao: string;
  eventos: ReviewEvento[];
  fechadoEm: Timestamp;
  fechadoPor: string;
}
