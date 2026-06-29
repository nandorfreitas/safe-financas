<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import {
  OrenPage,
  OrenButton,
  OrenBadge,
  OrenModal,
  OrenInput,
  OrenSelect,
  useToast,
} from "@/ui";
import type { SelectOption } from "@/ui";
import MoneyInput from "@/components/MoneyInput.vue";
import { useSubscriptions, useCards, useCategories } from "@/composables/useData";
import {
  createSubscription,
  updateSubscription,
  setSubscriptionActive,
  deleteSubscription,
} from "@/services/subscriptions";
import { formatBRL } from "@/lib/money";
import type { Subscription } from "@/types/models";

const toast = useToast();
const subs = useSubscriptions();
const cards = useCards();
const categories = useCategories();

const visiveis = computed(() =>
  [...subs.value]
    .filter((s) => !s.arquivado)
    .sort((a, b) => Number(b.ativa) - Number(a.ativa) || a.descricao.localeCompare(b.descricao)),
);

const totalAtivas = computed(() =>
  visiveis.value.filter((s) => s.ativa).reduce((acc, s) => acc + s.valor, 0),
);
const ativasCount = computed(() => visiveis.value.filter((s) => s.ativa).length);

const cartoesAtivos = computed(() => cards.value.filter((c) => !c.arquivado && c.id));

function nomeCartao(id: string) {
  return cards.value.find((c) => c.id === id)?.nome ?? "—";
}
function nomeCategoria(id?: string) {
  return id ? categories.value.find((c) => c.id === id)?.nome ?? "—" : "—";
}

const cardOptions = computed<SelectOption[]>(() =>
  cartoesAtivos.value.map((c) => ({ label: c.nome, value: c.id ?? "" })),
);
const categoriaOptions = computed<SelectOption[]>(() => [
  { label: "— sem categoria —", value: "" },
  ...categories.value
    .filter((c) => c.tipo === "despesa" && !c.arquivada)
    .map((c) => ({ label: c.nome, value: c.id ?? "" })),
]);

// ── Criar / editar ──
const modalOpen = ref(false);
const editingId = ref<string | null>(null);
const saving = ref(false);
const form = reactive({
  descricao: "",
  valor: 0,
  cardId: "",
  categoryId: "",
});

function abrirNovo() {
  if (cartoesAtivos.value.length === 0) {
    toast.error("Cadastre um cartão antes de criar uma assinatura.");
    return;
  }
  editingId.value = null;
  Object.assign(form, {
    descricao: "",
    valor: 0,
    cardId: cartoesAtivos.value[0]?.id ?? "",
    categoryId: "",
  });
  modalOpen.value = true;
}

function abrirEdicao(s: Subscription) {
  editingId.value = s.id ?? null;
  Object.assign(form, {
    descricao: s.descricao,
    valor: s.valor,
    cardId: s.cardId,
    categoryId: s.categoryId ?? "",
  });
  modalOpen.value = true;
}

async function salvar() {
  if (!form.descricao.trim()) {
    toast.error("Informe uma descrição.");
    return;
  }
  saving.value = true;
  try {
    if (editingId.value) {
      await updateSubscription(editingId.value, {
        descricao: form.descricao.trim(),
        categoryId: form.categoryId || null,
      });
      toast.success("Assinatura atualizada.");
    } else {
      if (form.valor <= 0) {
        toast.error("Informe o valor mensal.");
        return;
      }
      if (!form.cardId) {
        toast.error("Selecione o cartão.");
        return;
      }
      await createSubscription({
        descricao: form.descricao.trim(),
        valor: form.valor,
        cardId: form.cardId,
        categoryId: form.categoryId || undefined,
      });
      toast.success("Assinatura criada — cobrança lançada na fatura do mês.");
    }
    modalOpen.value = false;
  } catch (e) {
    toast.error("Não foi possível salvar.");
    console.error(e);
  } finally {
    saving.value = false;
  }
}

const alternando = ref<string | null>(null);
async function alternarAtiva(s: Subscription) {
  if (!s.id) return;
  alternando.value = s.id;
  try {
    await setSubscriptionActive(s.id, !s.ativa);
    toast.success(s.ativa ? "Assinatura pausada." : "Assinatura reativada.");
  } catch (e) {
    toast.error("Não foi possível atualizar.");
    console.error(e);
  } finally {
    alternando.value = null;
  }
}

async function remover(s: Subscription) {
  if (!s.id) return;
  if (
    !confirm(
      `Excluir a assinatura "${s.descricao}"? As cobranças já lançadas nas faturas serão removidas.`,
    )
  )
    return;
  try {
    await deleteSubscription(s.id);
    toast.success("Assinatura excluída.");
  } catch (e) {
    toast.error("Não foi possível excluir.");
    console.error(e);
  }
}
</script>

<template>
  <OrenPage subtitle="Patrimônio" title="Assinaturas">
    <template #actions>
      <OrenButton variant="primary" @click="abrirNovo">Nova assinatura</OrenButton>
    </template>

    <div class="page-pad">
      <div class="summary-bar">
        <div class="summary">
          <span class="summary__label">Total mensal (ativas)</span>
          <span class="summary__value">{{ formatBRL(totalAtivas) }}</span>
        </div>
        <span class="summary__count">
          {{ ativasCount }} ativa(s) · {{ visiveis.length }} no total
        </span>
      </div>

      <p v-if="visiveis.length === 0" class="empty">
        Nenhuma assinatura ainda. Cadastre serviços recorrentes (streaming, software…)
        ligados a um cartão — a cobrança entra automaticamente na fatura de cada mês.
      </p>

      <div v-else class="subs-scroll">
        <div class="subs">
          <div class="subs__head">
            <span>Assinatura</span>
            <span>Cartão</span>
            <span>Categoria</span>
            <span class="num">Valor/mês</span>
            <span>Status</span>
            <span></span>
          </div>
          <div v-for="s in visiveis" :key="s.id" class="subs__row" :class="{ 'is-paused': !s.ativa }">
            <strong>{{ s.descricao }}</strong>
            <span class="muted">{{ nomeCartao(s.cardId) }}</span>
            <span class="muted">{{ nomeCategoria(s.categoryId) }}</span>
            <span class="num">{{ formatBRL(s.valor) }}</span>
            <span>
              <OrenBadge :variant="s.ativa ? 'success' : 'neutral'">
                {{ s.ativa ? "Ativa" : "Pausada" }}
              </OrenBadge>
            </span>
            <span class="subs__actions">
              <OrenButton size="sm" variant="ghost" @click="abrirEdicao(s)">Editar</OrenButton>
              <OrenButton
                size="sm"
                variant="ghost"
                :loading="alternando === s.id"
                @click="alternarAtiva(s)"
              >
                {{ s.ativa ? "Pausar" : "Reativar" }}
              </OrenButton>
              <OrenButton size="sm" variant="danger" @click="remover(s)">Excluir</OrenButton>
            </span>
          </div>
        </div>
      </div>
    </div>

    <OrenModal
      v-model="modalOpen"
      :title="editingId ? 'Editar assinatura' : 'Nova assinatura'"
    >
      <div class="form">
        <OrenInput
          v-model="form.descricao"
          label="Descrição"
          placeholder="Ex.: Netflix"
        />
        <OrenSelect
          v-model="form.cardId"
          label="Cartão"
          :options="cardOptions"
          :disabled="!!editingId"
        />
        <template v-if="!editingId">
          <MoneyInput v-model="form.valor" label="Valor mensal (R$)" />
        </template>
        <p v-else class="hint">
          Valor e cartão não mudam após a criação. Para alterá-los, exclua e recrie.
        </p>
        <OrenSelect v-model="form.categoryId" label="Categoria" :options="categoriaOptions" />
        <p class="hint">
          A cobrança é lançada na fatura do cartão todo mês (despesa fixa, não essencial).
        </p>
      </div>
      <template #footer="{ close }">
        <OrenButton variant="ghost" @click="close">Cancelar</OrenButton>
        <OrenButton variant="primary" :loading="saving" @click="salvar">Salvar</OrenButton>
      </template>
    </OrenModal>
  </OrenPage>
</template>

<style scoped>
.summary-bar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}
.summary {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.summary__label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}
.summary__value {
  font-size: 26px;
  font-weight: 700;
}
.summary__count {
  font-size: 13px;
  color: var(--text-muted);
}
.empty {
  color: var(--text-muted);
  font-size: 14px;
}

/* Tabela de assinaturas */
.subs-scroll {
  overflow-x: auto;
  border: 1px solid var(--border-default);
  border-radius: var(--radius);
}
.subs {
  min-width: 720px;
}
.subs__head,
.subs__row {
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr 0.9fr 0.8fr auto;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
}
.subs__head {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
  border-bottom: 2px solid var(--border-default);
}
.subs__row {
  border-bottom: 1px solid var(--border-subtle, var(--border-default));
}
.subs__row:last-child {
  border-bottom: none;
}
.subs__row.is-paused {
  opacity: 0.6;
}
.muted {
  color: var(--text-muted);
}
.num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.subs__actions {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
}
.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 340px;
}
.hint {
  margin: 0;
  font-size: 13px;
  color: var(--text-muted);
}
</style>
