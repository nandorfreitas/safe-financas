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
  OrenSelect,
  OrenToggle,
  useToast,
} from "@/ui";
import type { SelectOption } from "@/ui";
import MoneyInput from "@/components/MoneyInput.vue";
import { useLoans, useCategories } from "@/composables/useData";
import {
  createLoan,
  updateLoan,
  deleteLoan,
  backfillLoansFixa,
} from "@/services/loans";
import { formatBRL } from "@/lib/money";
import { categoryOptions } from "@/lib/categoryTree";
import type { Loan, TipoTransacao } from "@/types/models";

const router = useRouter();
const toast = useToast();
const loans = useLoans();
const categories = useCategories();

function nomeCategoria(id?: string) {
  return id ? categories.value.find((c) => c.id === id)?.nome ?? "—" : "—";
}

const visiveis = computed(() =>
  [...loans.value]
    .filter((l) => !l.arquivado)
    .sort((a, b) => a.descricao.localeCompare(b.descricao)),
);

const aPagar = computed(() => visiveis.value.filter((l) => l.tipo === "despesa"));
const aReceber = computed(() => visiveis.value.filter((l) => l.tipo === "receita"));

const grupos = computed(() => [
  { key: "despesa" as TipoTransacao, label: "A pagar", loans: aPagar.value },
  { key: "receita" as TipoTransacao, label: "A receber", loans: aReceber.value },
]);

function total(l: Loan) {
  return l.valorParcela * l.parcelas;
}
function fmtVenc(l: Loan) {
  try {
    return l.primeiroVencimento.toDate().toLocaleDateString("pt-BR");
  } catch {
    return "—";
  }
}

const tipoOptions: SelectOption[] = [
  { label: "A pagar (eu devo)", value: "despesa" },
  { label: "A receber (vão me pagar)", value: "receita" },
];

// ── Criar / editar ──
const modalOpen = ref(false);
const editingId = ref<string | null>(null);
const saving = ref(false);

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

const form = reactive({
  descricao: "",
  tipo: "despesa" as TipoTransacao,
  valorParcela: 0,
  parcelas: 12,
  vencISO: hojeISO(),
  contraparte: "",
  essencial: false,
  categoryId: "",
  compartilhado: true,
});

const totalPreview = computed(() => form.valorParcela * Number(form.parcelas || 0));

// Categorias do tipo selecionado (despesa para "a pagar", receita para "a receber").
const categoriaOptions = computed<SelectOption[]>(() =>
  categoryOptions(categories.value, form.tipo, { label: "Empréstimos (padrão)" }),
);

function abrirNovo() {
  editingId.value = null;
  Object.assign(form, {
    descricao: "",
    tipo: "despesa",
    valorParcela: 0,
    parcelas: 12,
    vencISO: hojeISO(),
    contraparte: "",
    essencial: false,
    categoryId: "",
    compartilhado: true,
  });
  modalOpen.value = true;
}

function abrirEdicao(l: Loan) {
  editingId.value = l.id ?? null;
  Object.assign(form, {
    descricao: l.descricao,
    tipo: l.tipo,
    valorParcela: l.valorParcela,
    parcelas: l.parcelas,
    vencISO: l.primeiroVencimento.toDate().toISOString().slice(0, 10),
    contraparte: l.contraparte ?? "",
    essencial: l.essencial ?? false,
    categoryId: l.categoryId ?? "",
    compartilhado: l.visibilidade === "compartilhada",
  });
  modalOpen.value = true;
}

async function salvar() {
  if (!form.descricao.trim()) {
    toast.error("Informe uma descrição.");
    return;
  }
  const visibilidade = form.compartilhado ? "compartilhada" : "pessoal";
  saving.value = true;
  try {
    if (editingId.value) {
      // Pós-criação: só nome, contraparte e visibilidade (valor/parcelas/direção
      // são imutáveis — para mudá-los, exclua e recrie).
      await updateLoan(editingId.value, {
        descricao: form.descricao.trim(),
        contraparte: form.contraparte.trim() || null,
        visibilidade,
        essencial: form.tipo === "despesa" ? form.essencial : false,
        categoryId: form.categoryId || null,
      });
      toast.success("Empréstimo atualizado.");
    } else {
      if (form.valorParcela <= 0) {
        toast.error("Informe o valor da prestação.");
        return;
      }
      const n = Number(form.parcelas);
      if (!Number.isInteger(n) || n < 1 || n > 420) {
        toast.error("Número de prestações inválido (1–420).");
        return;
      }
      await createLoan({
        descricao: form.descricao.trim(),
        tipo: form.tipo,
        valorParcela: form.valorParcela,
        parcelas: n,
        primeiroVencimento: new Date(form.vencISO + "T12:00:00"),
        contraparte: form.contraparte.trim() || undefined,
        essencial: form.tipo === "despesa" ? form.essencial : undefined,
        categoryId: form.categoryId || undefined,
        visibilidade,
      });
      toast.success(`Empréstimo criado em ${n}x.`);
    }
    modalOpen.value = false;
  } catch (e) {
    toast.error("Não foi possível salvar.");
    console.error(e);
  } finally {
    saving.value = false;
  }
}

async function remover(l: Loan) {
  if (!l.id) return;
  if (
    !confirm(
      `Excluir o empréstimo "${l.descricao}"? Todas as ${l.parcelas} prestação(ões) também serão removidas.`,
    )
  )
    return;
  try {
    await deleteLoan(l.id);
    toast.success("Empréstimo excluído.");
  } catch (e) {
    toast.error("Não foi possível excluir.");
    console.error(e);
  }
}

function abrirDetalhe(l: Loan) {
  if (l.id) router.push({ name: "loan-detail", params: { loanId: l.id } });
}

// ── Backfill: marcar prestações de "a pagar" como fixas (empréstimos antigos) ──
const marcandoFixas = ref(false);
async function marcarFixas() {
  const ids = aPagar.value.map((l) => l.id).filter((id): id is string => !!id);
  if (ids.length === 0) {
    toast.error("Nenhum empréstimo a pagar.");
    return;
  }
  if (!confirm("Marcar as prestações de todos os empréstimos a pagar como fixas?"))
    return;
  marcandoFixas.value = true;
  try {
    const n = await backfillLoansFixa(ids);
    toast.success(
      n > 0 ? `${n} prestação(ões) marcada(s) como fixa.` : "Tudo já estava fixo.",
    );
  } catch (e) {
    toast.error("Não foi possível atualizar.");
    console.error(e);
  } finally {
    marcandoFixas.value = false;
  }
}
</script>

<template>
  <OrenPage subtitle="Patrimônio" title="Empréstimos">
    <template #actions>
      <OrenButton
        v-if="aPagar.length"
        variant="ghost"
        :loading="marcandoFixas"
        @click="marcarFixas"
      >
        Marcar prestações como fixas
      </OrenButton>
      <OrenButton variant="primary" @click="abrirNovo">Novo empréstimo</OrenButton>
    </template>

    <div class="page-pad">
      <p v-if="visiveis.length === 0" class="empty">
        Nenhum empréstimo ainda. Cadastre valores a pagar (que você deve) ou a receber
        (que vão te pagar) — cada prestação entra no previsto e no efetivo do mês.
      </p>

      <section v-for="g in grupos" v-else :key="g.key" class="grupo">
        <div class="grupo__head" :class="`grupo__head--${g.key}`">
          <h2 class="grupo__title">{{ g.label }}</h2>
        </div>

        <p v-if="g.loans.length === 0" class="empty empty--seg">
          Nenhum empréstimo {{ g.label.toLowerCase() }}.
        </p>

        <div v-else class="cards-grid">
          <OrenCard v-for="l in g.loans" :key="l.id" class="loan-tile">
            <template #title>
              <div class="tile-head">
                <span>{{ l.descricao }}</span>
                <OrenBadge :variant="l.visibilidade === 'compartilhada' ? 'info' : 'neutral'">
                  {{ l.visibilidade === "compartilhada" ? "Compartilhado" : "Pessoal" }}
                </OrenBadge>
              </div>
            </template>

            <ul class="tile-info">
              <li v-if="l.tipo === 'despesa'">
                <span>Essencial</span>
                <OrenBadge :variant="l.essencial ? 'success' : 'neutral'">
                  {{ l.essencial ? "Sim" : "Não" }}
                </OrenBadge>
              </li>
              <li v-if="l.contraparte">
                <span>{{ l.tipo === "despesa" ? "Credor" : "Devedor" }}</span>
                <b>{{ l.contraparte }}</b>
              </li>
              <li><span>Categoria</span><b>{{ nomeCategoria(l.categoryId) }}</b></li>
              <li><span>Prestação</span><b>{{ formatBRL(l.valorParcela) }}</b></li>
              <li><span>Prestações</span><b>{{ l.parcelas }}x</b></li>
              <li>
                <span>Total</span>
                <b :class="l.tipo === 'receita' ? 'val-pos' : 'val-neg'">
                  {{ l.tipo === "receita" ? "+" : "−" }}{{ formatBRL(total(l)) }}
                </b>
              </li>
              <li><span>1º vencimento</span><b>{{ fmtVenc(l) }}</b></li>
            </ul>

            <template #footer>
              <div class="tile-actions">
                <OrenButton size="sm" variant="primary" @click="abrirDetalhe(l)">
                  Prestações
                </OrenButton>
                <OrenButton size="sm" variant="ghost" @click="abrirEdicao(l)">Editar</OrenButton>
                <OrenButton size="sm" variant="danger" @click="remover(l)">Excluir</OrenButton>
              </div>
            </template>
          </OrenCard>
        </div>
      </section>
    </div>

    <OrenModal
      v-model="modalOpen"
      :title="editingId ? 'Editar empréstimo' : 'Novo empréstimo'"
    >
      <div class="form">
        <OrenInput
          v-model="form.descricao"
          label="Descrição"
          placeholder="Ex.: Financiamento do carro"
        />
        <OrenSelect
          v-model="form.tipo"
          label="Tipo"
          :options="tipoOptions"
          :disabled="!!editingId"
        />
        <OrenInput
          v-model="form.contraparte"
          :label="form.tipo === 'despesa' ? 'Credor (opcional)' : 'Devedor (opcional)'"
          placeholder="Ex.: Banco X / João"
        />
        <OrenSelect
          v-model="form.categoryId"
          label="Categoria"
          :options="categoriaOptions"
        />

        <template v-if="!editingId">
          <MoneyInput v-model="form.valorParcela" label="Valor da prestação (R$)" />
          <OrenInput
            v-model.number="form.parcelas"
            label="Número de prestações"
            type="number"
          />
          <div class="field">
            <label>1º vencimento</label>
            <input v-model="form.vencISO" type="date" class="date-input" />
          </div>
          <p class="hint">
            Total: <b>{{ formatBRL(totalPreview) }}</b>. A 1ª prestação cai no mês do
            vencimento; as demais nos meses seguintes.
          </p>
        </template>
        <p v-else class="hint">
          Valor, prestações e direção não mudam após a criação. Para alterá-los,
          exclua e recrie o empréstimo.
        </p>

        <OrenToggle v-if="form.tipo === 'despesa'" v-model="form.essencial">
          Essencial (mínimo para viver — entra no % da receita)
        </OrenToggle>
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
.empty--seg {
  margin: 0 0 4px;
}
.grupo {
  margin-bottom: 28px;
}
.grupo__head {
  padding-bottom: 8px;
  margin-bottom: 16px;
  border-bottom: 2px solid var(--border-default);
}
.grupo__head--receita {
  border-bottom-color: var(--action-primary, #1f7a4d);
}
.grupo__head--despesa {
  border-bottom-color: #b42318;
}
.grupo__title {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
}
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}
.loan-tile {
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
.tile-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 340px;
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
</style>
