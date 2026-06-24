<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import {
  OrenPage,
  OrenButton,
  OrenTable,
  OrenBadge,
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
  setAccountVisibilidade,
  deleteAccount,
} from "@/services/accounts";
import { useWorkspaceStore } from "@/stores/workspace";
import { formatBRL } from "@/lib/money";
import type { Account } from "@/types/models";

const toast = useToast();
const wsStore = useWorkspaceStore();
const accounts = useAccounts();

const contas = computed(() =>
  [...accounts.value]
    .filter((a) => a.tipo === "conta" && !a.arquivada)
    .sort((a, b) => a.nome.localeCompare(b.nome)),
);

const total = computed(() => contas.value.reduce((s, a) => s + a.saldo, 0));

const columns: Column<Account>[] = [
  { key: "nome", label: "Conta" },
  { key: "saldo", label: "Saldo" },
  { key: "visibilidade", label: "Visibilidade" },
  { key: "donoUid", label: "Dono" },
  { key: "id", label: "" },
];

function nomeDono(uid: string): string {
  return wsStore.active?.members[uid]?.nome ?? "—";
}

// ── Criar/editar conta ──
const modalOpen = ref(false);
const editingId = ref<string | null>(null);
const saving = ref(false);
const form = reactive({
  nome: "",
  saldo: 0,
  compartilhada: false,
});

function abrirNovo() {
  editingId.value = null;
  Object.assign(form, { nome: "", saldo: 0, compartilhada: false });
  modalOpen.value = true;
}

function abrirEdicao(a: Account) {
  editingId.value = a.id ?? null;
  Object.assign(form, {
    nome: a.nome,
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
        saldo: form.saldo,
        visibilidade,
      });
      toast.success("Conta atualizada.");
    } else {
      await createAccount({
        nome: form.nome,
        tipo: "conta",
        saldo: form.saldo,
        visibilidade,
      });
      toast.success("Conta criada.");
    }
    modalOpen.value = false;
  } catch (e) {
    toast.error("Não foi possível salvar.");
    console.error(e);
  } finally {
    saving.value = false;
  }
}

// ── Ajuste de saldo ──
const saldoModalOpen = ref(false);
const saldoTarget = ref<Account | null>(null);
const novoSaldo = ref(0);
const ajustando = ref(false);

function abrirAjuste(a: Account) {
  saldoTarget.value = a;
  novoSaldo.value = a.saldo;
  saldoModalOpen.value = true;
}

async function confirmarAjuste() {
  if (!saldoTarget.value?.id) return;
  ajustando.value = true;
  try {
    await setSaldo(saldoTarget.value.id, novoSaldo.value);
    toast.success("Saldo ajustado.");
    saldoModalOpen.value = false;
  } catch (e) {
    toast.error("Não foi possível ajustar.");
    console.error(e);
  } finally {
    ajustando.value = false;
  }
}

async function alternarVisibilidade(a: Account) {
  if (!a.id) return;
  const nova = a.visibilidade === "compartilhada" ? "pessoal" : "compartilhada";
  try {
    await setAccountVisibilidade(a.id, nova);
  } catch (e) {
    toast.error("Não foi possível alterar a visibilidade.");
    console.error(e);
  }
}

async function remover(a: Account) {
  if (!a.id) return;
  if (!confirm(`Excluir a conta "${a.nome}"?`)) return;
  try {
    await deleteAccount(a.id);
    toast.success("Conta excluída.");
  } catch (e) {
    toast.error("Não foi possível excluir.");
    console.error(e);
  }
}
</script>

<template>
  <OrenPage subtitle="Patrimônio" title="Contas" :description="`Total: ${formatBRL(total)}`">
    <template #actions>
      <OrenButton variant="primary" @click="abrirNovo">Nova conta</OrenButton>
    </template>

    <div class="page-pad">
      <p v-if="contas.length === 0" class="empty">
        Nenhuma conta ainda. O saldo de cada conta é a fonte da verdade do orçamento.
      </p>

      <OrenTable v-else :columns="columns" :rows="contas">
        <template #cell-saldo="{ value }">
          <strong>{{ formatBRL(Number(value)) }}</strong>
        </template>
        <template #cell-visibilidade="{ row }">
          <button class="vis-toggle" @click="alternarVisibilidade(row)">
            <OrenBadge :variant="row.visibilidade === 'compartilhada' ? 'info' : 'neutral'">
              {{ row.visibilidade === "compartilhada" ? "Compartilhada" : "Pessoal" }}
            </OrenBadge>
          </button>
        </template>
        <template #cell-donoUid="{ value }">
          {{ nomeDono(String(value)) }}
        </template>
        <template #cell-id="{ row }">
          <div class="row-actions">
            <OrenButton size="sm" variant="secondary" @click="abrirAjuste(row)">
              Ajustar saldo
            </OrenButton>
            <OrenButton size="sm" variant="ghost" @click="abrirEdicao(row)">Editar</OrenButton>
            <OrenButton size="sm" variant="danger" @click="remover(row)">Excluir</OrenButton>
          </div>
        </template>
      </OrenTable>
    </div>

    <!-- Criar / editar -->
    <OrenModal v-model="modalOpen" :title="editingId ? 'Editar conta' : 'Nova conta'">
      <div class="form">
        <OrenInput v-model="form.nome" label="Nome" placeholder="Ex.: Nubank" />
        <MoneyInput v-model="form.saldo" label="Saldo atual (R$)" />
        <OrenToggle v-model="form.compartilhada">Compartilhar com o workspace</OrenToggle>
      </div>
      <template #footer="{ close }">
        <OrenButton variant="ghost" @click="close">Cancelar</OrenButton>
        <OrenButton variant="primary" :loading="saving" @click="salvar">Salvar</OrenButton>
      </template>
    </OrenModal>

    <!-- Ajuste de saldo -->
    <OrenModal v-model="saldoModalOpen" title="Ajustar saldo">
      <div class="form">
        <p class="hint">
          O saldo é manual e é a fonte da verdade. Informe o valor atual real da conta
          <strong>{{ saldoTarget?.nome }}</strong>.
        </p>
        <MoneyInput v-model="novoSaldo" label="Novo saldo (R$)" />
      </div>
      <template #footer="{ close }">
        <OrenButton variant="ghost" @click="close">Cancelar</OrenButton>
        <OrenButton variant="primary" :loading="ajustando" @click="confirmarAjuste">
          Salvar saldo
        </OrenButton>
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
.hint {
  margin: 0;
  font-size: 13px;
  color: var(--text-muted);
}
.row-actions {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}
.vis-toggle {
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
}
</style>
