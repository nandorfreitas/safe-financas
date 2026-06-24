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
  /** Soma automática das compras/parcelas. Somente leitura. */
  valorRegistrado: number;
  /** O que vale (entra no orçamento). Editável livremente. */
  valorFinal: number;
  /** Se true, valorFinal foi editado à mão e não acompanha mais valorRegistrado. */
  valorFinalManual?: boolean;
  /** Conta que quitou a fatura. */
  pagaPorContaId?: string;
  dataPagamento?: Timestamp;
  criadoPor: string;
}

export interface Category {
  id?: string;
  nome: string;
  tipo: TipoCategoria;
  cor: string;
  fixaPorPadrao: boolean;
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
  data: Timestamp;
  /** Conta de origem (despesa/receita comum). */
  accountId?: string;
  /** Se for compra de cartão. */
  cardId?: string;
  categoryId?: string;
  /** Só despesa; default herdado da categoria. */
  fixa: boolean;
  /** Só compra de cartão — define a fatura. */
  competencia?: Competencia;
  invoiceId?: string;
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
