<script setup lang="ts">
import { OrenPage, OrenStatCard, OrenCard, OrenAlert } from "@oren/design-system";
import { useWorkspaceStore } from "@/stores/workspace";

const wsStore = useWorkspaceStore();

// Valores ainda zerados — a camada de cálculo (orçamento previsto × realizado)
// entra no próximo marco, ligada às coleções de contas/transações.
</script>

<template>
  <OrenPage
    subtitle="Visão geral"
    title="Dashboard"
    :description="wsStore.active?.name"
  >
    <div class="page-pad">
      <OrenAlert feedback="info">
        Fundação pronta. Os números abaixo são placeholders — a camada de cálculo
        (previsto × realizado, fixas, investimentos) será ligada às coleções no
        próximo passo.
      </OrenAlert>

      <div class="cards-grid" style="margin-top: 20px">
        <OrenStatCard label="Orçamento previsto" value="R$ 0,00" tone="capital" />
        <OrenStatCard label="Orçamento realizado" value="R$ 0,00" tone="payments" />
        <OrenStatCard
          label="Despesas fixas"
          value="R$ 0,00"
          delta-label="0% da receita do mês"
        />
        <OrenStatCard
          label="Investimentos"
          value="R$ 0,00"
          tone="governance"
        />
      </div>

      <OrenCard style="margin-top: 20px">
        <h3 style="margin-top: 0">Faturas em aberto</h3>
        <p style="color: var(--text-muted); font-size: 14px">
          Nenhuma fatura próxima do vencimento.
        </p>
      </OrenCard>
    </div>
  </OrenPage>
</template>
