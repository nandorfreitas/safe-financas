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
import { computed, type MaybeRefOrGetter } from "vue";
import type { Competencia } from "@/types/models";
import { useAccounts, useTransactionsMonth, useInvoicesMonth } from "./useData";

export function useBudget(competencia: MaybeRefOrGetter<Competencia>) {
  const accounts = useAccounts();
  const txs = useTransactionsMonth(competencia);
  const faturas = useInvoicesMonth(competencia);

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

  // Faturas de cartão desta competência (já vêm filtradas pelo mês).
  // Abertas = "mais uma despesa a pagar"; pagas = gasto já efetivado no mês.
  const faturasAbertas = computed(() =>
    faturas.value
      .filter((i) => i.status === "aberta")
      .reduce((s, i) => s + i.valorFinal, 0),
  );
  const faturasPagas = computed(() =>
    faturas.value
      .filter((i) => i.status === "paga")
      .reduce((s, i) => s + i.valorFinal, 0),
  );
  const faturasTotal = computed(() => faturasAbertas.value + faturasPagas.value);

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
  // Gasto no mês = despesas em caixa já pagas + faturas de cartão pagas.
  const pagoMes = computed(
    () => sumP((t) => t.tipo === "despesa" && t.realizado, valEf) + faturasPagas.value,
  );

  // ── Comparação plano × real (fluxos do mês inteiro, para o fechamento) ──
  const receitaPrevista = computed(() =>
    sumP((t) => t.tipo === "receita" && t.previsto, valPrev),
  );
  // A fatura é uma despesa esperada do mês (paga ou não); entra no previsto
  // para o plano × real ficar coerente com o gasto realizado.
  const despesaPrevista = computed(
    () => sumP((t) => t.tipo === "despesa" && t.previsto, valPrev) + faturasTotal.value,
  );
  const previstoFlows = computed(() => receitaPrevista.value - despesaPrevista.value);
  const realizadoFlows = computed(() => recebidoMes.value - pagoMes.value);
  const divergenciaFlows = computed(() => realizadoFlows.value - previstoFlows.value);

  // ── Despesas essenciais previstas (mínimo para viver) sobre a receita ──
  // "Essencial" é independente de "fixa" (recorrente): uma despesa variável
  // como mercado pode ser essencial sem ser fixa.
  const despesasEssenciais = computed(() =>
    sumP((t) => t.tipo === "despesa" && t.essencial && t.previsto, valPrev),
  );
  const percentEssenciais = computed(() =>
    receitaPrevista.value === 0
      ? 0
      : (despesasEssenciais.value / receitaPrevista.value) * 100,
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
    faturasPagas,
    faturasTotal,
    projecaoSaldoFinal,
    recebidoMes,
    pagoMes,
    receitaPrevista,
    despesaPrevista,
    previstoFlows,
    realizadoFlows,
    divergenciaFlows,
    despesasEssenciais,
    percentEssenciais,
  };
}
