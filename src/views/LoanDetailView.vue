<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  OrenPage,
  OrenButton,
  OrenCard,
  OrenBadge,
  OrenTable,
  OrenModal,
  useToast,
} from "@/ui";
import type { Column } from "@/ui";
import MoneyInput from "@/components/MoneyInput.vue";
import { useLoans, useLoanTransactions } from "@/composables/useData";
import { updateTransaction } from "@/services/transactions";
import { deleteLoan } from "@/services/loans";
import { formatBRL } from "@/lib/money";
import type { Loan, Transaction } from "@/types/models";

const route = useRoute();
const router = useRouter();
const toast = useToast();

const loanId = computed(() => route.params.loanId as string);
const loans = useLoans();
const loan = computed<Loan | null>(
  () => loans.value.find((l) => l.id === loanId.value) ?? null,
);
const prestacoes = useLoanTransactions(loanId);

const aReceber = computed(() => loan.value?.tipo === "receita");
const verbo = computed(() => (aReceber.value ? "Receber" : "Pagar"));
const verboPassado = computed(() => (aReceber.value ? "Recebido" : "Pago"));

const ordenadas = computed(() =>
  [...prestacoes.value].sort(
    (a, b) => (a.parcelaNum ?? 0) - (b.parcelaNum ?? 0),
  ),
);

function prev(t: Transaction): number {
  return t.valorPrevisto ?? t.valor;
}

const totalContratado = computed(() =>
  ordenadas.value.reduce((s, t) => s + prev(t), 0),
);
const totalEfetivado = computed(() =>
  ordenadas.value.filter((t) => t.realizado).reduce((s, t) => s + t.valor, 0),
);
const totalPendente = computed(() =>
  ordenadas.value.filter((t) => !t.realizado).reduce((s, t) => s + prev(t), 0),
);
const pagasCount = computed(() => ordenadas.value.filter((t) => t.realizado).length);
const quitado = computed(
  () => ordenadas.value.length > 0 && pagasCount.value === ordenadas.value.length,
);

const columns: Column<Transaction>[] = [
  { key: "parcelaNum", label: "Parcela" },
  { key: "data", label: "Vencimento" },
  { key: "previsto", label: "Status" },
  { key: "valorPrevisto", label: "Previsto" },
  { key: "valor", label: "Efetivo" },
  { key: "id", label: "" },
];

function fmtData(ts: Transaction["data"]) {
  try {
    return ts.toDate().toLocaleDateString("pt-BR");
  } catch {
    return "—";
  }
}

// ── Registrar pagamento/recebimento (efetivar com valor e data) ──
const modalOpen = ref(false);
const alvo = ref<Transaction | null>(null);
const salvando = ref(false);
const reg = reactive({
  valorEfetivo: 0,
  dataISO: new Date().toISOString().slice(0, 10),
});

function abrirRegistro(t: Transaction) {
  alvo.value = t;
  reg.valorEfetivo = prev(t);
  reg.dataISO = new Date().toISOString().slice(0, 10);
  modalOpen.value = true;
}

async function confirmarRegistro() {
  if (!alvo.value?.id) return;
  if (reg.valorEfetivo <= 0) {
    toast.error("Informe o valor efetivo.");
    return;
  }
  salvando.value = true;
  try {
    await updateTransaction(alvo.value.id, {
      realizado: true,
      valor: reg.valorEfetivo,
      dataEfetivacao: new Date(reg.dataISO + "T12:00:00"),
    });
    toast.success(aReceber.value ? "Prestação recebida." : "Prestação paga.");
    modalOpen.value = false;
  } catch (e) {
    toast.error("Não foi possível registrar.");
    console.error(e);
  } finally {
    salvando.value = false;
  }
}

const desfazendo = ref<string | null>(null);
async function desfazer(t: Transaction) {
  if (!t.id) return;
  desfazendo.value = t.id;
  try {
    await updateTransaction(t.id, {
      realizado: false,
      valor: prev(t),
      dataEfetivacao: null,
    });
    toast.success("Prestação reaberta.");
  } catch (e) {
    toast.error("Não foi possível reabrir.");
    console.error(e);
  } finally {
    desfazendo.value = null;
  }
}

async function remover() {
  if (!loan.value?.id) return;
  if (
    !confirm(
      `Excluir o empréstimo "${loan.value.descricao}" e todas as suas prestações?`,
    )
  )
    return;
  try {
    await deleteLoan(loan.value.id);
    toast.success("Empréstimo excluído.");
    router.push({ name: "loans" });
  } catch (e) {
    toast.error("Não foi possível excluir.");
    console.error(e);
  }
}
</script>

<template>
  <OrenPage
    subtitle="Patrimônio"
    :title="loan?.descricao ?? 'Empréstimo'"
    :description="aReceber ? 'A receber' : 'A pagar'"
  >
    <template #actions>
      <OrenButton variant="ghost" @click="router.push({ name: 'loans' })">
        ‹ Empréstimos
      </OrenButton>
      <OrenButton variant="danger" @click="remover">Excluir</OrenButton>
    </template>

    <div class="page-pad">
      <OrenCard class="summary-card">
        <div class="summary-grid">
          <div class="metric">
            <span class="metric__label">Total</span>
            <span class="metric__value">{{ formatBRL(totalContratado) }}</span>
            <span class="metric__hint">
              {{ ordenadas.length }}x de {{ formatBRL(loan?.valorParcela ?? 0) }}
            </span>
          </div>
          <div class="metric">
            <span class="metric__label">{{ verboPassado }}</span>
            <span class="metric__value val-pos">{{ formatBRL(totalEfetivado) }}</span>
            <span class="metric__hint">{{ pagasCount }}/{{ ordenadas.length }} prestações</span>
          </div>
          <div class="metric">
            <span class="metric__label">Restante</span>
            <span class="metric__value val-neg">{{ formatBRL(totalPendente) }}</span>
          </div>
          <div class="metric">
            <span class="metric__label">Status</span>
            <div>
              <OrenBadge :variant="quitado ? 'success' : 'warning'">
                {{ quitado ? "Quitado" : "Em aberto" }}
              </OrenBadge>
            </div>
            <span v-if="loan?.contraparte" class="metric__hint">
              {{ aReceber ? "Devedor" : "Credor" }}: {{ loan.contraparte }}
            </span>
          </div>
        </div>
      </OrenCard>

      <h3 class="section-head">Prestações</h3>

      <p v-if="ordenadas.length === 0" class="empty">Nenhuma prestação encontrada.</p>

      <OrenTable v-else :columns="columns" :rows="ordenadas">
        <template #cell-parcelaNum="{ row }">
          {{ row.parcelaNum }}/{{ row.parcelaTotal }}
        </template>
        <template #cell-data="{ row }">{{ fmtData(row.data) }}</template>
        <template #cell-previsto="{ row }">
          <OrenBadge v-if="row.realizado" variant="success">{{ verboPassado }}</OrenBadge>
          <OrenBadge v-else variant="warning">A {{ verbo.toLowerCase() }}</OrenBadge>
        </template>
        <template #cell-valorPrevisto="{ row }">
          <span :class="aReceber ? 'val-pos' : 'val-neg'">
            {{ aReceber ? "+" : "−" }}{{ formatBRL(prev(row)) }}
          </span>
        </template>
        <template #cell-valor="{ row }">
          <strong v-if="row.realizado" :class="aReceber ? 'val-pos' : 'val-neg'">
            {{ aReceber ? "+" : "−" }}{{ formatBRL(row.valor) }}
          </strong>
          <span v-else class="prev-hint">— a efetivar</span>
        </template>
        <template #cell-id="{ row }">
          <div class="row-actions">
            <OrenButton
              v-if="!row.realizado"
              size="sm"
              variant="primary"
              @click="abrirRegistro(row)"
            >
              {{ verbo }}
            </OrenButton>
            <OrenButton
              v-else
              size="sm"
              variant="ghost"
              :loading="desfazendo === row.id"
              @click="desfazer(row)"
            >
              Desfazer
            </OrenButton>
          </div>
        </template>
      </OrenTable>
    </div>

    <OrenModal v-model="modalOpen" :title="`${verbo} prestação`">
      <div class="form">
        <MoneyInput
          v-model="reg.valorEfetivo"
          :label="aReceber ? 'Valor recebido (R$)' : 'Valor pago (R$)'"
        />
        <div class="field">
          <label>{{ aReceber ? "Data do recebimento" : "Data do pagamento" }}</label>
          <input v-model="reg.dataISO" type="date" class="date-input" />
        </div>
        <p class="hint">
          Atualizar o saldo da conta é manual (o saldo é a verdade em tempo real).
        </p>
      </div>
      <template #footer="{ close }">
        <OrenButton variant="ghost" @click="close">Cancelar</OrenButton>
        <OrenButton variant="primary" :loading="salvando" @click="confirmarRegistro">
          Confirmar
        </OrenButton>
      </template>
    </OrenModal>
  </OrenPage>
</template>

<style scoped>
.summary-card {
  margin-bottom: 24px;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 20px;
}
.metric {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.metric__label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}
.metric__value {
  font-size: 22px;
  font-weight: 600;
}
.metric__hint {
  font-size: 12px;
  color: var(--text-muted);
}
.section-head {
  margin: 0 0 12px;
  font-weight: 500;
}
.empty {
  color: var(--text-muted);
  font-size: 14px;
}
.row-actions {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}
.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 320px;
}
.field label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
}
.date-input {
  width: 100%;
  box-sizing: border-box;
  font-family: inherit;
  font-size: 15px;
  padding: 10px 13px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius);
  background: var(--surface-raised);
  color: var(--text-default);
}
.hint {
  margin: 0;
  font-size: 13px;
  color: var(--text-muted);
}
.val-pos {
  color: var(--action-primary, #1f7a4d);
}
.val-neg {
  color: #b42318;
}
.prev-hint {
  font-size: 11px;
  color: var(--text-muted);
}
</style>
