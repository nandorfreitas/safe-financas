<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import {
  OrenPage,
  OrenButton,
  OrenTable,
  OrenBadge,
  OrenModal,
  OrenInput,
  OrenSelect,
  OrenToggle,
  useToast,
} from "@/ui";
import type { Column, SelectOption } from "@/ui";
import { useCategories } from "@/composables/useData";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/services/categories";
import type { Category, TipoCategoria } from "@/types/models";

const toast = useToast();
const categories = useCategories();

// Ordena agrupando subcategorias sob o pai (topo por tipo+nome, depois subs).
const ordenadas = computed<Category[]>(() => {
  const ativas = categories.value.filter((c) => !c.arquivada);
  const byNome = (a: Category, b: Category) => a.nome.localeCompare(b.nome);
  const tops = ativas
    .filter((c) => !c.parentId)
    .sort((a, b) => a.tipo.localeCompare(b.tipo) || byNome(a, b));
  const idsTop = new Set(tops.map((t) => t.id));
  const out: Category[] = [];
  for (const t of tops) {
    out.push(t);
    for (const s of ativas.filter((c) => c.parentId === t.id).sort(byNome)) out.push(s);
  }
  for (const c of ativas) if (c.parentId && !idsTop.has(c.parentId)) out.push(c);
  return out;
});

const columns: Column<Category>[] = [
  { key: "nome", label: "Nome" },
  { key: "tipo", label: "Tipo" },
  { key: "cor", label: "Cor" },
  { key: "fixaPorPadrao", label: "Fixa por padrão" },
  { key: "essencialPorPadrao", label: "Essencial por padrão" },
  { key: "id", label: "" },
];

const tipoOptions: SelectOption[] = [
  { label: "Despesa", value: "despesa" },
  { label: "Receita", value: "receita" },
];

const modalOpen = ref(false);
const editingId = ref<string | null>(null);
const saving = ref(false);
const form = reactive({
  nome: "",
  tipo: "despesa" as TipoCategoria,
  parentId: "",
  cor: "#1f7a4d",
  fixaPorPadrao: false,
  essencialPorPadrao: false,
});

// Opções de categoria-pai: categorias de topo do mesmo tipo (exceto a própria).
const parentOptions = computed<SelectOption[]>(() => [
  { label: "— nenhuma (categoria de topo) —", value: "" },
  ...categories.value
    .filter(
      (c) =>
        c.tipo === form.tipo && !c.arquivada && !c.parentId && c.id !== editingId.value,
    )
    .sort((a, b) => a.nome.localeCompare(b.nome))
    .map((c) => ({ label: c.nome, value: c.id ?? "" })),
]);

function abrirNovo() {
  editingId.value = null;
  Object.assign(form, {
    nome: "",
    tipo: "despesa",
    parentId: "",
    cor: "#1f7a4d",
    fixaPorPadrao: false,
    essencialPorPadrao: false,
  });
  modalOpen.value = true;
}

function abrirEdicao(c: Category) {
  editingId.value = c.id ?? null;
  Object.assign(form, {
    nome: c.nome,
    tipo: c.tipo,
    parentId: c.parentId ?? "",
    cor: c.cor,
    fixaPorPadrao: c.fixaPorPadrao,
    essencialPorPadrao: c.essencialPorPadrao ?? false,
  });
  modalOpen.value = true;
}

// Trocar o tipo invalida o pai selecionado (pais são por tipo).
watch(
  () => form.tipo,
  () => {
    form.parentId = "";
  },
);

async function salvar() {
  if (!form.nome.trim()) {
    toast.error("Informe um nome.");
    return;
  }
  saving.value = true;
  try {
    const base = {
      nome: form.nome.trim(),
      tipo: form.tipo,
      cor: form.cor,
      fixaPorPadrao: form.fixaPorPadrao,
      essencialPorPadrao: form.essencialPorPadrao,
    };
    if (editingId.value) {
      await updateCategory(editingId.value, {
        ...base,
        parentId: form.parentId || null,
      });
      toast.success("Categoria atualizada.");
    } else {
      await createCategory({ ...base, parentId: form.parentId || undefined });
      toast.success("Categoria criada.");
    }
    modalOpen.value = false;
  } catch (e) {
    toast.error("Não foi possível salvar.");
    console.error(e);
  } finally {
    saving.value = false;
  }
}

async function remover(c: Category) {
  if (!c.id) return;
  if (!confirm(`Excluir a categoria "${c.nome}"?`)) return;
  try {
    await deleteCategory(c.id);
    toast.success("Categoria excluída.");
  } catch (e) {
    toast.error("Não foi possível excluir.");
    console.error(e);
  }
}
</script>

<template>
  <OrenPage subtitle="Organização" title="Categorias">
    <template #actions>
      <OrenButton variant="primary" @click="abrirNovo">Nova categoria</OrenButton>
    </template>

    <div class="page-pad">
      <p v-if="ordenadas.length === 0" class="empty">
        Nenhuma categoria ainda. Crie a primeira para classificar seus lançamentos.
      </p>

      <OrenTable v-else :columns="columns" :rows="ordenadas">
        <template #cell-nome="{ row }">
          <span :class="{ 'sub-name': row.parentId }">
            <span v-if="row.parentId" class="sub-mark">↳</span>{{ row.nome }}
          </span>
        </template>
        <template #cell-tipo="{ value }">
          <OrenBadge :variant="value === 'receita' ? 'success' : 'neutral'">
            {{ value === "receita" ? "Receita" : "Despesa" }}
          </OrenBadge>
        </template>
        <template #cell-cor="{ value }">
          <span class="swatch" :style="{ background: String(value) }" />
          <code>{{ value }}</code>
        </template>
        <template #cell-fixaPorPadrao="{ value }">
          {{ value ? "Sim" : "—" }}
        </template>
        <template #cell-essencialPorPadrao="{ value }">
          {{ value ? "Sim" : "—" }}
        </template>
        <template #cell-id="{ row }">
          <div class="row-actions">
            <OrenButton size="sm" variant="ghost" @click="abrirEdicao(row)">Editar</OrenButton>
            <OrenButton size="sm" variant="danger" @click="remover(row)">Excluir</OrenButton>
          </div>
        </template>
      </OrenTable>
    </div>

    <OrenModal v-model="modalOpen" :title="editingId ? 'Editar categoria' : 'Nova categoria'">
      <div class="form">
        <OrenInput v-model="form.nome" label="Nome" placeholder="Ex.: Mercado" />
        <OrenSelect v-model="form.tipo" label="Tipo" :options="tipoOptions" />
        <OrenSelect
          v-model="form.parentId"
          label="Categoria pai (opcional)"
          :options="parentOptions"
        />
        <div class="field-cor">
          <label>Cor</label>
          <input v-model="form.cor" type="color" class="color-input" />
        </div>
        <template v-if="form.tipo === 'despesa'">
          <OrenToggle v-model="form.fixaPorPadrao">
            Fixa por padrão (repete nos próximos meses)
          </OrenToggle>
          <OrenToggle v-model="form.essencialPorPadrao">
            Essencial por padrão (entra no % da receita)
          </OrenToggle>
        </template>
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
.sub-name {
  color: var(--text-muted);
}
.sub-mark {
  margin-right: 6px;
  opacity: 0.6;
}
.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 320px;
}
.field-cor label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
}
.color-input {
  width: 56px;
  height: 36px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius);
  background: none;
  cursor: pointer;
}
.swatch {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 4px;
  margin-right: 8px;
  vertical-align: middle;
  border: 1px solid var(--border-default);
}
.row-actions {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}
</style>
