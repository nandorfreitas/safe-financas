<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { OrenPage, OrenStatCard, OrenCard, OrenBadge } from "@oren/design-system";
import { useWorkspaceStore } from "@/stores/workspace";
import { useBudget } from "@/composables/useBudget";
import { useOpenInvoices } from "@/composables/useData";
import { formatBRL } from "@/lib/money";
import { competenciaDe, competenciaLabel } from "@/lib/competencia";

const router = useRouter();
const wsStore = useWorkspaceStore();
const competencia = ref(competenciaDe());

const {
  saldoAtual,
  projecaoSaldoFinal,
  aReceber,
  aPagar,
  recebidoMes,
  pagoMes,
  despesasEssenciais,
  percentEssenciais,
  totalInvestimentos,
} = useBudget(competencia);

const openInvoices = useOpenInvoices();

function fmtVenc(ms: number) {
  return ms ? new Date(ms).toLocaleDateString("pt-BR") : "—";
}
</script>

<template>
  <OrenPage
    subtitle="Visão geral"
    title="Dashboard"
    :description="`${wsStore.active?.name ?? ''} · ${competenciaLabel(competencia)}`"
  >
    <div class="page-pad">
      <!-- Os dois números principais -->
      <div class="cards-grid">
        <OrenStatCard
          label="Saldo atual"
          :value="formatBRL(saldoAtual)"
          tone="payments"
          source="soma dos saldos das contas"
        />
        <OrenStatCard
          label="Projeção de saldo final"
          :value="formatBRL(projecaoSaldoFinal)"
          tone="capital"
          source="se tudo ocorrer como previsto"
        />
        <OrenStatCard
          label="A receber"
          :value="formatBRL(aReceber)"
          source="recebimentos previstos pendentes"
        />
        <OrenStatCard
          label="A pagar"
          :value="formatBRL(aPagar)"
          source="contas previstas + faturas em aberto"
        />
      </div>

      <!-- Secundários -->
      <div class="cards-grid" style="margin-top: 16px">
        <OrenStatCard label="Recebido no mês" :value="formatBRL(recebidoMes)" />
        <OrenStatCard label="Gasto no mês" :value="formatBRL(pagoMes)" />
        <OrenStatCard
          label="Despesas essenciais"
          :value="formatBRL(despesasEssenciais)"
          :delta-label="`${Math.round(percentEssenciais)}% da receita prevista`"
        />
        <OrenStatCard
          label="Investimentos"
          :value="formatBRL(totalInvestimentos)"
          tone="governance"
          source="patrimônio, fora do caixa"
        />
      </div>

      <OrenCard style="margin-top: 20px">
        <template #title>Faturas em aberto</template>
        <p v-if="openInvoices.length === 0" class="muted">Nenhuma fatura em aberto.</p>
        <ul v-else class="invoices">
          <li
            v-for="inv in openInvoices"
            :key="inv.invoiceId"
            class="invoice-row"
            @click="router.push({ name: 'card-detail', params: { cardId: inv.cardId } })"
          >
            <div class="invoice-row__main">
              <strong>{{ inv.cardNome }}</strong>
              <span class="muted">{{ competenciaLabel(inv.competencia) }}</span>
            </div>
            <div class="invoice-row__right">
              <span>{{ formatBRL(inv.valorFinal) }}</span>
              <OrenBadge variant="warning">vence {{ fmtVenc(inv.vencimentoMs) }}</OrenBadge>
            </div>
          </li>
        </ul>
      </OrenCard>
    </div>
  </OrenPage>
</template>

<style scoped>
.muted {
  color: var(--text-muted);
  font-size: 14px;
  margin: 0;
}
.invoices {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}
.invoice-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 4px;
  border-bottom: 1px solid var(--border-subtle, var(--border-default));
  cursor: pointer;
}
.invoice-row:last-child {
  border-bottom: none;
}
.invoice-row:hover {
  background: var(--surface-subtle);
}
.invoice-row__main {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.invoice-row__right {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
