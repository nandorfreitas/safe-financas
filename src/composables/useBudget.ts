/**
 * Cálculos de orçamento (seção 3 do escopo). Tudo em centavos.
 *
 * Previsto  = Σ saldos das contas + receitas previstas-não-realizadas
 *                                 − despesas previstas-não-realizadas
 * Realizado = Σ saldos das contas + receitas realizadas − despesas realizadas
 *
 * Investimentos ficam FORA do orçamento de caixa (são patrimônio).
 */
import { computed, type MaybeRefOrGetter } from "vue";
import type { Competencia } from "@/types/models";
import { useAccounts, useTransactionsMonth } from "./useData";

export function useBudget(competencia: MaybeRefOrGetter<Competencia>) {
  const accounts = useAccounts();
  const txs = useTransactionsMonth(competencia);

  const saldoContas = computed(() =>
    accounts.value
      .filter((a) => a.tipo === "conta" && !a.arquivada)
      .reduce((s, a) => s + a.saldo, 0),
  );

  const totalInvestimentos = computed(() =>
    accounts.value
      .filter((a) => a.tipo === "investimento" && !a.arquivada)
      .reduce((s, a) => s + a.saldo, 0),
  );

  // Compras de cartão (cardId) NÃO entram no caixa — só o pagamento da fatura
  // pesa (via baixa de saldo). Excluímos aqui para evitar dupla contagem.
  // O lado PREVISTO usa o valor previsto (a previsão); o lado REALIZADO usa o
  // valor efetivo. Cada um cai no `valorPrevisto`/`valor` com fallback ao outro,
  // para lançamentos antigos que só têm um dos campos.
  type Tx = (typeof txs.value)[number];
  const valPrevisto = (t: Tx) => t.valorPrevisto ?? t.valor;
  const valEfetivo = (t: Tx) => t.valor ?? t.valorPrevisto ?? 0;

  const sumBy = (pred: (t: Tx) => boolean, val: (t: Tx) => number) =>
    txs.value
      .filter((t) => !t.cardId)
      .filter(pred)
      .reduce((s, t) => s + val(t), 0);

  // Mesma fórmula, conjuntos diferentes: o previsto enxerga os lançamentos
  // previstos (pelo valor previsto); o realizado, os realizados (pelo efetivo).
  const receitasPrev = computed(() =>
    sumBy((t) => t.tipo === "receita" && t.previsto, valPrevisto),
  );
  const despesasPrev = computed(() =>
    sumBy((t) => t.tipo === "despesa" && t.previsto, valPrevisto),
  );
  const receitasReal = computed(() =>
    sumBy((t) => t.tipo === "receita" && t.realizado, valEfetivo),
  );
  const despesasReal = computed(() =>
    sumBy((t) => t.tipo === "despesa" && t.realizado, valEfetivo),
  );

  const previstoTotal = computed(
    () => saldoContas.value + receitasPrev.value - despesasPrev.value,
  );
  const realizadoTotal = computed(
    () => saldoContas.value + receitasReal.value - despesasReal.value,
  );

  const divergencia = computed(() => realizadoTotal.value - previstoTotal.value);

  // Receita prevista do mês (denominador para o % de fixas).
  const receitaPrevista = computed(() => receitasPrev.value);

  // Despesas fixas previstas do mês (sobre a receita prevista).
  const despesasFixas = computed(() =>
    sumBy((t) => t.tipo === "despesa" && t.fixa && t.previsto, valPrevisto),
  );

  const percentFixas = computed(() =>
    receitaPrevista.value === 0
      ? 0
      : (despesasFixas.value / receitaPrevista.value) * 100,
  );

  return {
    accounts,
    txs,
    saldoContas,
    totalInvestimentos,
    previstoTotal,
    realizadoTotal,
    divergencia,
    receitaPrevista,
    despesasFixas,
    percentFixas,
  };
}
