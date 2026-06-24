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
  const sum = (pred: (t: (typeof txs.value)[number]) => boolean) =>
    txs.value
      .filter((t) => !t.cardId)
      .filter(pred)
      .reduce((s, t) => s + t.valor, 0);

  // Mesma fórmula, conjuntos diferentes: o previsto enxerga TODOS os lançamentos
  // previstos (mesmo já realizados); o realizado, todos os realizados.
  const receitasPrev = computed(() =>
    sum((t) => t.tipo === "receita" && t.previsto),
  );
  const despesasPrev = computed(() =>
    sum((t) => t.tipo === "despesa" && t.previsto),
  );
  const receitasReal = computed(() => sum((t) => t.tipo === "receita" && t.realizado));
  const despesasReal = computed(() => sum((t) => t.tipo === "despesa" && t.realizado));

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
    sum((t) => t.tipo === "despesa" && t.fixa && t.previsto),
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
