<script setup lang="ts">
import { computed, ref } from "vue";
import { OrenPage, OrenStatCard, OrenCard } from "@oren/design-system";
import { useWorkspaceStore } from "@/stores/workspace";
import { useBudget } from "@/composables/useBudget";
import { formatBRL } from "@/lib/money";
import { competenciaDe, competenciaLabel } from "@/lib/competencia";

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
        <p class="muted">
          A gestão de cartões e faturas entra no próximo marco. Aqui aparecerão as
          faturas abertas com vencimento próximo.
        </p>
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
</style>
