/**
 * Cálculos de orçamento — MODELO AO VIVO (seção 3 do escopo).
 *
 * O saldo das contas é a verdade em tempo real (atualizado à mão: salário entra,
 * conta paga sai). A projeção responde "quanto vou ter no fim do mês se tudo
 * correr como planejei", contando apenas o que ainda está PENDENTE:
 *
 *   Projeção de saldo final = Σ saldos atuais
 *                           + receitas previstas ainda NÃO recebidas
 *                           − despesas previstas ainda NÃO pagas
 *                           − faturas de cartão em aberto deste mês
 *
 * Tudo em centavos. Investimentos ficam de fora (patrimônio).
 */
import { computed, type MaybeRefOrGetter, toValue } from "vue";
import type { Competencia } from "@/types/models";
import { useAccounts, useTransactionsMonth, useOpenInvoices } from "./useData";

export function useBudget(competencia: MaybeRefOrGetter<Competencia>) {
  const accounts = useAccounts();
  const txs = useTransactionsMonth(competencia);
  const openInvoices = useOpenInvoices();

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

  type Tx = (typeof txs.value)[number];
  const valPrev = (t: Tx) => t.valorPrevisto ?? t.valor; // valor previsto
  const valEf = (t: Tx) => t.valor ?? t.valorPrevisto ?? 0; // valor efetivo

  // Compras de cartão entram no orçamento via a FATURA (não a compra avulsa).
  const cashTx = computed(() => txs.value.filter((t) => !t.cardId));
  const sumP = (pred: (t: Tx) => boolean, val: (t: Tx) => number) =>
    cashTx.value.filter(pred).reduce((s, t) => s + val(t), 0);

  // Faturas de cartão EM ABERTO desta competência = "mais uma despesa a pagar".
  const comp = computed(() => toValue(competencia));
  const faturasAbertas = computed(() =>
    openInvoices.value
      .filter((i) => i.competencia === comp.value)
      .reduce((s, i) => s + i.valorFinal, 0),
  );

  // ── Pendentes (previsto e ainda não realizado) ──
  const aReceber = computed(() =>
    sumP((t) => t.tipo === "receita" && t.previsto && !t.realizado, valPrev),
  );
  const aPagarLancamentos = computed(() =>
    sumP((t) => t.tipo === "despesa" && t.previsto && !t.realizado, valPrev),
  );
  const aPagar = computed(() => aPagarLancamentos.value + faturasAbertas.value);

  const saldoAtual = saldoContas;
  const projecaoSaldoFinal = computed(
    () => saldoContas.value + aReceber.value - aPagar.value,
  );

  // ── Já realizado no mês (fluxos efetivos) ──
  const recebidoMes = computed(() =>
    sumP((t) => t.tipo === "receita" && t.realizado, valEf),
  );
  const pagoMes = computed(() => sumP((t) => t.tipo === "despesa" && t.realizado, valEf));

  // ── Comparação plano × real (fluxos do mês inteiro, para o fechamento) ──
  const receitaPrevista = computed(() =>
    sumP((t) => t.tipo === "receita" && t.previsto, valPrev),
  );
  const despesaPrevista = computed(() =>
    sumP((t) => t.tipo === "despesa" && t.previsto, valPrev),
  );
  const previstoFlows = computed(() => receitaPrevista.value - despesaPrevista.value);
  const realizadoFlows = computed(() => recebidoMes.value - pagoMes.value);
  const divergenciaFlows = computed(() => realizadoFlows.value - previstoFlows.value);

  // ── Despesas fixas previstas (sobre a receita prevista) ──
  const despesasFixas = computed(() =>
    sumP((t) => t.tipo === "despesa" && t.fixa && t.previsto, valPrev),
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
    saldoAtual,
    totalInvestimentos,
    aReceber,
    aPagar,
    aPagarLancamentos,
    faturasAbertas,
    projecaoSaldoFinal,
    recebidoMes,
    pagoMes,
    receitaPrevista,
    despesaPrevista,
    previstoFlows,
    realizadoFlows,
    divergenciaFlows,
    despesasFixas,
    percentFixas,
  };
}
