<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { OrenPage, OrenStatCard, OrenCard, OrenBadge } from "@oren/design-system";
import { useWorkspaceStore } from "@/stores/workspace";
import { useBudget } from "@/composables/useBudget";
import { useOpenInvoices } from "@/composables/useData";
import { formatBRL } from "@/lib/money";
import { competenciaDe, competenciaLabel } from "@/lib/competencia";

const router = useRouter();
const openInvoices = useOpenInvoices();

function fmtVenc(ms: number) {
  return ms ? new Date(ms).toLocaleDateString("pt-BR") : "—";
}

const wsStore = useWorkspaceStore();
const competencia = ref(competenciaDe());

const {
  previstoTotal,
  realizadoTotal,
  divergencia,
  despesasFixas,
  percentFixas,
  totalInvestimentos,
} = useBudget(competencia);

// Divergência como % do previsto (para o chip do card de realizado).
const divergenciaPct = computed(() => {
  if (previstoTotal.value === 0) return undefined;
  return Math.round((divergencia.value / Math.abs(previstoTotal.value)) * 100);
});
</script>

<template>
  <OrenPage
    subtitle="Visão geral"
    title="Dashboard"
    :description="`${wsStore.active?.name ?? ''} · ${competenciaLabel(competencia)}`"
  >
    <div class="page-pad">
      <div class="cards-grid">
        <OrenStatCard
          label="Orçamento previsto"
          :value="formatBRL(previstoTotal)"
          tone="capital"
          source="saldos + previstos não realizados"
        />
        <OrenStatCard
          label="Orçamento realizado"
          :value="formatBRL(realizadoTotal)"
          tone="payments"
          :delta="divergenciaPct"
          delta-label="vs. previsto"
        />
        <OrenStatCard
          label="Despesas fixas"
          :value="formatBRL(despesasFixas)"
          :delta-label="`${Math.round(percentFixas)}% da receita do mês`"
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
        <p v-if="openInvoices.length === 0" class="muted">
          Nenhuma fatura em aberto.
        </p>
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
