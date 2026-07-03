<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import {
  OrenPage,
  OrenButton,
  OrenCard,
  OrenBadge,
  OrenModal,
  OrenInput,
  OrenToggle,
  useToast,
} from "@/ui";
import MoneyInput from "@/components/MoneyInput.vue";
import { useCards, useInvoicesMonth } from "@/composables/useData";
import { createCard, updateCard, deleteCard } from "@/services/cards";
import { formatBRL } from "@/lib/money";
import { competenciaDe } from "@/lib/competencia";
import type { Card } from "@/types/models";

const router = useRouter();
const toast = useToast();
const cards = useCards();

// Fatura da competência vigente por cartão (para mostrar o valor atual no card).
const faturasMes = useInvoicesMonth(competenciaDe());
function faturaAtual(cardId?: string) {
  return cardId ? faturasMes.value.find((f) => f.cardId === cardId) ?? null : null;
}

const visiveis = computed(() =>
  [...cards.value]
    .filter((c) => !c.arquivado)
    .sort((a, b) => a.nome.localeCompare(b.nome)),
);

const modalOpen = ref(false);
const editingId = ref<string | null>(null);
const saving = ref(false);
const form = reactive({
  nome: "",
  limite: 0,
  diaVencimento: 10,
  bandeira: "",
  compartilhado: true,
});

function abrirNovo() {
  editingId.value = null;
  Object.assign(form, {
    nome: "",
    limite: 0,
    diaVencimento: 10,
    bandeira: "",
    compartilhado: true,
  });
  modalOpen.value = true;
}

function abrirEdicao(c: Card) {
  editingId.value = c.id ?? null;
  Object.assign(form, {
    nome: c.nome,
    limite: c.limite ?? 0,
    diaVencimento: c.diaVencimento,
    bandeira: c.bandeira ?? "",
    compartilhado: c.visibilidade === "compartilhada",
  });
  modalOpen.value = true;
}

async function salvar() {
  if (!form.nome.trim()) {
    toast.error("Informe um nome.");
    return;
  }
  const dia = Number(form.diaVencimento);
  if (!Number.isInteger(dia) || dia < 1 || dia > 31) {
    toast.error("Dia de vencimento deve estar entre 1 e 31.");
    return;
  }
  saving.value = true;
  try {
    const visibilidade = form.compartilhado ? "compartilhada" : "pessoal";
    if (editingId.value) {
      await updateCard(editingId.value, {
        nome: form.nome,
        limite: form.limite || undefined,
        diaVencimento: dia,
        bandeira: form.bandeira || undefined,
        visibilidade,
      });
      toast.success("Cartão atualizado.");
    } else {
      await createCard({
        nome: form.nome,
        limite: form.limite || undefined,
        diaVencimento: dia,
        bandeira: form.bandeira || undefined,
        visibilidade,
      });
      toast.success("Cartão criado.");
    }
    modalOpen.value = false;
  } catch (e) {
    toast.error("Não foi possível salvar.");
    console.error(e);
  } finally {
    saving.value = false;
  }
}

async function remover(c: Card) {
  if (!c.id) return;
  if (!confirm(`Excluir o cartão "${c.nome}"? As faturas e compras associadas não são removidas automaticamente.`))
    return;
  try {
    await deleteCard(c.id);
    toast.success("Cartão excluído.");
  } catch (e) {
    toast.error("Não foi possível excluir.");
    console.error(e);
  }
}

function abrirDetalhe(c: Card) {
  if (c.id) router.push({ name: "card-detail", params: { cardId: c.id } });
}
</script>

<template>
  <OrenPage subtitle="Patrimônio" title="Cartões">
    <template #actions>
      <OrenButton variant="primary" @click="abrirNovo">Novo cartão</OrenButton>
    </template>

    <div class="page-pad">
      <p v-if="visiveis.length === 0" class="empty">
        Nenhum cartão ainda. O cartão é um passivo — seu “valor” é a fatura aberta.
      </p>

      <div v-else class="cards-grid">
        <OrenCard v-for="c in visiveis" :key="c.id" class="card-tile">
          <template #title>
            <div class="tile-head">
              <span>{{ c.nome }}</span>
              <OrenBadge :variant="c.visibilidade === 'compartilhada' ? 'info' : 'neutral'">
                {{ c.visibilidade === "compartilhada" ? "Compartilhado" : "Pessoal" }}
              </OrenBadge>
            </div>
          </template>

          <div class="tile-fatura">
            <span class="tile-fatura__label">Fatura atual</span>
            <div class="tile-fatura__row">
              <span class="tile-fatura__value">
                {{ formatBRL(faturaAtual(c.id)?.valorRegistrado ?? 0) }}
              </span>
              <OrenBadge
                v-if="faturaAtual(c.id)"
                :variant="faturaAtual(c.id)?.status === 'paga' ? 'success' : 'warning'"
              >
                {{ faturaAtual(c.id)?.status === "paga" ? "Paga" : "Aberta" }}
              </OrenBadge>
            </div>
          </div>

          <ul class="tile-info">
            <li><span>Bandeira</span><b>{{ c.bandeira || "—" }}</b></li>
            <li><span>Vencimento</span><b>dia {{ c.diaVencimento }}</b></li>
            <li>
              <span>Limite</span><b>{{ c.limite ? formatBRL(c.limite) : "—" }}</b>
            </li>
          </ul>

          <template #footer>
            <div class="tile-actions">
              <OrenButton size="sm" variant="primary" block @click="abrirDetalhe(c)">
                Ver faturas
              </OrenButton>
              <div class="tile-actions__sec">
                <OrenButton size="sm" variant="ghost" block @click="abrirEdicao(c)">
                  Editar
                </OrenButton>
                <OrenButton size="sm" variant="danger" block @click="remover(c)">
                  Excluir
                </OrenButton>
              </div>
            </div>
          </template>
        </OrenCard>
      </div>
    </div>

    <OrenModal v-model="modalOpen" :title="editingId ? 'Editar cartão' : 'Novo cartão'">
      <div class="form">
        <OrenInput v-model="form.nome" label="Nome" placeholder="Ex.: Nubank Mastercard" />
        <OrenInput v-model="form.bandeira" label="Bandeira" placeholder="Ex.: Mastercard" />
        <OrenInput
          v-model.number="form.diaVencimento"
          label="Dia de vencimento (1–31)"
          type="number"
        />
        <MoneyInput v-model="form.limite" label="Limite (R$, opcional)" />
        <OrenToggle v-model="form.compartilhado">Compartilhar com o workspace</OrenToggle>
      </div>
      <template #footer="{ close }">
        <OrenButton variant="ghost" @click="close">Cancelar</OrenButton>
        <OrenButton variant="primary" :loading="saving" @click="salvar">Salvar</OrenButton>
      </template>
    </OrenModal>
  </OrenPage>
</template>

<style scoped>
.empty {
  color: var(--text-muted);
  font-size: 14px;
}
.card-tile {
  min-width: 0;
}
.tile-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.tile-info {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
}
.tile-info li {
  display: flex;
  justify-content: space-between;
}
.tile-info span {
  color: var(--text-muted);
}
.tile-fatura {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  margin-bottom: 14px;
  background: var(--surface-subtle);
  border-radius: var(--radius);
}
.tile-fatura__label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}
.tile-fatura__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.tile-fatura__value {
  font-size: 20px;
  font-weight: 600;
}
.tile-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.tile-actions__sec {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 320px;
}
</style>
