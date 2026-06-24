<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import {
  OrenPage,
  OrenButton,
  OrenTable,
  OrenModal,
  OrenInput,
  OrenToggle,
  useToast,
} from "@oren/design-system";
import type { Column } from "@oren/design-system";
import MoneyInput from "@/components/MoneyInput.vue";
import { useAccounts } from "@/composables/useData";
import {
  createAccount,
  updateAccount,
  setSaldo,
  deleteAccount,
} from "@/services/accounts";
import { formatBRL } from "@/lib/money";
import type { Account } from "@/types/models";

const toast = useToast();
const accounts = useAccounts();

const investimentos = computed(() =>
  [...accounts.value]
    .filter((a) => a.tipo === "investimento" && !a.arquivada)
    .sort((a, b) => a.nome.localeCompare(b.nome)),
);

const total = computed(() => investimentos.value.reduce((s, a) => s + a.saldo, 0));

const columns: Column<Account>[] = [
  { key: "nome", label: "Investimento" },
  { key: "instituicao", label: "Instituição" },
  { key: "tipoInvest", label: "Tipo" },
  { key: "saldo", label: "Valor" },
  { key: "id", label: "" },
];

const modalOpen = ref(false);
const editingId = ref<string | null>(null);
const saving = ref(false);
const form = reactive({
  nome: "",
  instituicao: "",
  tipoInvest: "",
  saldo: 0,
  compartilhada: true, // default do tipo investimento
});

function abrirNovo() {
  editingId.value = null;
  Object.assign(form, {
    nome: "",
    instituicao: "",
    tipoInvest: "",
    saldo: 0,
    compartilhada: true,
  });
  modalOpen.value = true;
}

function abrirEdicao(a: Account) {
  editingId.value = a.id ?? null;
  Object.assign(form, {
    nome: a.nome,
    instituicao: a.instituicao ?? "",
    tipoInvest: a.tipoInvest ?? "",
    saldo: a.saldo,
    compartilhada: a.visibilidade === "compartilhada",
  });
  modalOpen.value = true;
}

async function salvar() {
  if (!form.nome.trim()) {
    toast.error("Informe um nome.");
    return;
  }
  saving.value = true;
  try {
    const visibilidade = form.compartilhada ? "compartilhada" : "pessoal";
    if (editingId.value) {
      await updateAccount(editingId.value, {
        nome: form.nome,
        instituicao: form.instituicao,
        tipoInvest: form.tipoInvest,
        visibilidade,
      });
      await setSaldo(editingId.value, form.saldo);
      toast.success("Investimento atualizado.");
    } else {
      await createAccount({
        nome: form.nome,
        tipo: "investimento",
        saldo: form.saldo,
        visibilidade,
        instituicao: form.instituicao || undefined,
        tipoInvest: form.tipoInvest || undefined,
      });
      toast.success("Investimento criado.");
    }
    modalOpen.value = false;
  } catch (e) {
    toast.error("Não foi possível salvar.");
    console.error(e);
  } finally {
    saving.value = false;
  }
}

async function remover(a: Account) {
  if (!a.id) return;
  if (!confirm(`Excluir o investimento "${a.nome}"?`)) return;
  try {
    await deleteAccount(a.id);
    toast.success("Investimento excluído.");
  } catch (e) {
    toast.error("Não foi possível excluir.");
    console.error(e);
  }
}
</script>

<template>
  <OrenPage
    subtitle="Patrimônio"
    title="Investimentos"
    :description="`Total acumulado: ${formatBRL(total)} — fora do orçamento de caixa`"
  >
    <template #actions>
      <OrenButton variant="primary" @click="abrirNovo">Novo investimento</OrenButton>
    </template>

    <div class="page-pad">
      <p v-if="investimentos.length === 0" class="empty">
        Nenhum investimento ainda. Eles contam como patrimônio, separados do fluxo do mês.
      </p>

      <OrenTable v-else :columns="columns" :rows="investimentos">
        <template #cell-instituicao="{ value }">{{ value || "—" }}</template>
        <template #cell-tipoInvest="{ value }">{{ value || "—" }}</template>
        <template #cell-saldo="{ value }">
          <strong>{{ formatBRL(Number(value)) }}</strong>
        </template>
        <template #cell-id="{ row }">
          <div class="row-actions">
            <OrenButton size="sm" variant="ghost" @click="abrirEdicao(row)">Editar</OrenButton>
            <OrenButton size="sm" variant="danger" @click="remover(row)">Excluir</OrenButton>
          </div>
        </template>
      </OrenTable>
    </div>

    <OrenModal
      v-model="modalOpen"
      :title="editingId ? 'Editar investimento' : 'Novo investimento'"
    >
      <div class="form">
        <OrenInput v-model="form.nome" label="Nome" placeholder="Ex.: Tesouro Selic" />
        <OrenInput v-model="form.instituicao" label="Instituição" placeholder="Ex.: XP" />
        <OrenInput v-model="form.tipoInvest" label="Tipo" placeholder="Ex.: Renda fixa" />
        <MoneyInput v-model="form.saldo" label="Valor atual (R$)" />
        <OrenToggle v-model="form.compartilhada">Compartilhar com o workspace</OrenToggle>
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
.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 320px;
}
.row-actions {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}
</style>
