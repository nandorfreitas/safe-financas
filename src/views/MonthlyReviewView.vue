<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import {
  OrenPage,
  OrenButton,
  OrenCard,
  OrenStatCard,
  OrenAlert,
  OrenTextarea,
  OrenInput,
  OrenBadge,
  useToast,
} from "@/ui";
import MoneyInput from "@/components/MoneyInput.vue";
import { useBudget } from "@/composables/useBudget";
import { useReview } from "@/composables/useData";
import { useWorkspaceStore } from "@/stores/workspace";
import { saveReview, novoEvento } from "@/services/monthlyReviews";
import { formatBRL } from "@/lib/money";
import { competenciaDe, competenciaLabel, addMeses } from "@/lib/competencia";
import type { ReviewEvento } from "@/types/models";

const toast = useToast();
const wsStore = useWorkspaceStore();

const competencia = ref(competenciaDe());
// Fechamento compara o FLUXO previsto × realizado do mês (não o saldo projetado).
const {
  previstoFlows: previstoTotal,
  realizadoFlows: realizadoTotal,
  divergenciaFlows: divergencia,
  receitaPrevista,
} = useBudget(competencia);
const review = useReview(competencia);

const limiar = computed(() => wsStore.active?.limiarDivergencia ?? 0.2);
// Limiar absoluto em centavos: fração × receita prevista.
const limiarValor = computed(() => Math.round(limiar.value * receitaPrevista.value));
const acimaDoLimiar = computed(
  () => limiarValor.value > 0 && Math.abs(divergencia.value) > limiarValor.value,
);

// ── Edição local (observação + eventos) ──
const observacao = ref("");
const eventos = reactive<ReviewEvento[]>([]);

// Sincroniza com o fechamento salvo ao trocar de mês.
watch(
  review,
  (r) => {
    observacao.value = r?.observacao ?? "";
    eventos.splice(0, eventos.length, ...(r?.eventos ?? []));
  },
  { immediate: true },
);

const novoEventoForm = reactive({ descricao: "", valor: 0 });
function adicionarEvento() {
  if (!novoEventoForm.descricao.trim() || novoEventoForm.valor <= 0) {
    toast.error("Informe descrição e valor do evento.");
    return;
  }
  eventos.push(novoEvento(novoEventoForm.descricao.trim(), novoEventoForm.valor));
  novoEventoForm.descricao = "";
  novoEventoForm.valor = 0;
}
function removerEvento(i: number) {
  eventos.splice(i, 1);
}

const salvando = ref(false);
async function fechar() {
  salvando.value = true;
  try {
    await saveReview(competencia.value, {
      previstoTotal: previstoTotal.value,
      realizadoTotal: realizadoTotal.value,
      divergencia: divergencia.value,
      observacao: observacao.value,
      eventos: [...eventos],
    });
    toast.success("Fechamento salvo.");
  } catch (e) {
    toast.error("Não foi possível salvar.");
    console.error(e);
  } finally {
    salvando.value = false;
  }
}

function fmtData(ts: ReviewEvento["data"]) {
  try {
    return ts.toDate().toLocaleDateString("pt-BR");
  } catch {
    return "—";
  }
}
const fechadoEm = computed(() => {
  const f = review.value?.fechadoEm;
  try {
    return f ? f.toDate().toLocaleDateString("pt-BR") : null;
  } catch {
    return null;
  }
});
</script>

<template>
  <OrenPage subtitle="Organização" title="Fechamento de mês">
    <template #actions>
      <OrenButton variant="primary" :loading="salvando" @click="fechar">
        Salvar fechamento
      </OrenButton>
    </template>

    <div class="page-pad">
      <div class="month-nav">
        <OrenButton size="sm" variant="ghost" @click="competencia = addMeses(competencia, -1)">‹</OrenButton>
        <span class="month-label">{{ competenciaLabel(competencia) }}</span>
        <OrenButton size="sm" variant="ghost" @click="competencia = addMeses(competencia, 1)">›</OrenButton>
        <OrenBadge v-if="fechadoEm" variant="success">Fechado em {{ fechadoEm }}</OrenBadge>
      </div>

      <div class="cards-grid">
        <OrenStatCard
          label="Previsto do mês"
          :value="formatBRL(previstoTotal)"
          tone="capital"
          source="receitas − despesas previstas"
        />
        <OrenStatCard
          label="Realizado do mês"
          :value="formatBRL(realizadoTotal)"
          tone="payments"
          source="recebido − pago"
        />
        <OrenStatCard
          label="Divergência"
          :value="formatBRL(divergencia)"
          :tone="acimaDoLimiar ? 'governance' : 'default'"
        />
      </div>

      <OrenAlert v-if="acimaDoLimiar" feedback="warning" style="margin-top: 16px">
        A divergência ({{ formatBRL(Math.abs(divergencia)) }}) passou do limiar de
        {{ Math.round(limiar * 100) }}% da receita prevista
        ({{ formatBRL(limiarValor) }}). Vale registrar o que explica o desvio abaixo.
      </OrenAlert>

      <OrenCard style="margin-top: 20px">
        <template #title>Observação</template>
        <OrenTextarea
          v-model="observacao"
          :rows="3"
          placeholder="O que explica a diferença entre o previsto e o realizado neste mês?"
        />
      </OrenCard>

      <OrenCard style="margin-top: 20px">
        <template #title>Eventos (anotação)</template>
        <p class="muted">
          Eventos são <b>descritivos</b> e não somam no realizado. Para que um gasto
          afete o orçamento, lance uma transação.
        </p>

        <ul v-if="eventos.length" class="eventos">
          <li v-for="(ev, i) in eventos" :key="i" class="evento">
            <div>
              <strong>{{ ev.descricao }}</strong>
              <span class="muted"> · {{ fmtData(ev.data) }}</span>
            </div>
            <div class="evento__right">
              <span>{{ formatBRL(ev.valor) }}</span>
              <OrenButton size="sm" variant="ghost" @click="removerEvento(i)">remover</OrenButton>
            </div>
          </li>
        </ul>

        <div class="evento-form">
          <OrenInput v-model="novoEventoForm.descricao" placeholder="Descrição do evento" />
          <MoneyInput v-model="novoEventoForm.valor" placeholder="0,00" />
          <OrenButton variant="secondary" @click="adicionarEvento">Adicionar</OrenButton>
        </div>
      </OrenCard>
    </div>
  </OrenPage>
</template>

<style scoped>
.month-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 18px;
}
.month-label {
  font-size: 16px;
  font-weight: 500;
  text-transform: capitalize;
  min-width: 160px;
  text-align: center;
}
.muted {
  color: var(--text-muted);
  font-size: 13px;
  margin: 0 0 12px;
}
.eventos {
  list-style: none;
  margin: 0 0 16px;
  padding: 0;
  display: flex;
  flex-direction: column;
}
.evento {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-subtle, var(--border-default));
}
.evento__right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.evento-form {
  display: grid;
  grid-template-columns: 1fr 160px auto;
  gap: 10px;
  align-items: start;
}
</style>
