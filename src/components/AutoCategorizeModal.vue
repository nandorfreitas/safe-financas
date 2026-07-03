<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { OrenModal, OrenButton, OrenSelect, OrenBadge, useToast } from "@/ui";
import type { SelectOption } from "@/ui";
import { useCategories, useCategoryHints } from "@/composables/useData";
import { suggestCategoryId, merchantKey } from "@/lib/categorize";
import { categoryOptions } from "@/lib/categoryTree";
import { categorizeTransactions } from "@/services/transactions";
import { saveCategoryHints } from "@/services/categoryHints";
import { formatBRL } from "@/lib/money";
import type { Transaction } from "@/types/models";

const props = defineProps<{
  modelValue: boolean;
  /** Universo de lançamentos a considerar (ex.: despesas do mês). */
  transactions: Transaction[];
}>();
const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "categorized", n: number): void;
}>();

const toast = useToast();
const categories = useCategories();
const hints = useCategoryHints();

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

interface PreviewRow {
  id: string;
  descricao: string;
  valor: number;
  isCartao: boolean;
  categoryId: string;
  /** Havia uma sugestão automática? (para o badge e o pré-check). */
  sugerida: boolean;
  incluir: boolean;
}
const preview = ref<PreviewRow[]>([]);
const saving = ref(false);

const categoriaOptions = computed<SelectOption[]>(() =>
  categoryOptions(categories.value, "despesa", { label: "— sem categoria —" }),
);

/** (Re)monta a prévia: despesas sem categoria + sugestão de cada uma. */
function rebuild() {
  const out: PreviewRow[] = [];
  for (const t of props.transactions) {
    if (!t.id || t.tipo !== "despesa" || t.categoryId) continue;
    const sugerido = suggestCategoryId(t.descricao, categories.value, hints.value);
    out.push({
      id: t.id,
      descricao: t.descricao,
      valor: t.valor,
      isCartao: !!t.cardId,
      categoryId: sugerido,
      sugerida: !!sugerido,
      incluir: !!sugerido,
    });
  }
  // Sugeridas primeiro; dentro de cada grupo, por descrição.
  out.sort((a, b) =>
    a.sugerida === b.sugerida
      ? a.descricao.localeCompare(b.descricao)
      : a.sugerida
        ? -1
        : 1,
  );
  preview.value = out;
}

watch(open, (v) => {
  if (v) rebuild();
});

const semCategoria = computed(() => preview.value.length);
const comSugestao = computed(() => preview.value.filter((r) => r.sugerida).length);
const selecionadas = computed(() =>
  preview.value.filter((r) => r.incluir && r.categoryId),
);

function marcarTodas(v: boolean) {
  for (const r of preview.value) if (r.categoryId) r.incluir = v;
}

async function confirmar() {
  const linhas = selecionadas.value;
  if (linhas.length === 0) {
    toast.error("Selecione ao menos um lançamento com categoria.");
    return;
  }
  saving.value = true;
  try {
    const n = await categorizeTransactions(
      linhas.map((r) => ({ id: r.id, categoryId: r.categoryId })),
    );
    // Aprender é secundário — não deve derrubar a categorização se falhar.
    try {
      await saveCategoryHints(
        linhas.map((r) => ({ key: merchantKey(r.descricao), categoryId: r.categoryId })),
      );
    } catch (e) {
      console.error("Falha ao salvar dicas (categorização concluída):", e);
    }
    toast.success(`${n} lançamento(s) categorizado(s).`);
    emit("categorized", n);
    open.value = false;
  } catch (e) {
    toast.error("Não foi possível categorizar.");
    console.error(e);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <OrenModal v-model="open" size="lg" title="Categorizar automaticamente">
    <div class="cat">
      <p v-if="!semCategoria" class="hint">
        Todas as despesas deste período já têm categoria. 🎉
      </p>
      <template v-else>
        <p class="hint">
          {{ semCategoria }} despesa(s) sem categoria — {{ comSugestao }} com sugestão
          (histórico + regras). Revise e confirme; as escolhas viram dicas para os
          próximos lançamentos.
        </p>

        <div class="bulk">
          <OrenButton size="sm" variant="ghost" @click="marcarTodas(true)">
            Marcar todas
          </OrenButton>
          <OrenButton size="sm" variant="ghost" @click="marcarTodas(false)">
            Desmarcar todas
          </OrenButton>
        </div>

        <div class="prev-scroll">
          <div class="prev">
            <div class="prev__head">
              <span></span>
              <span>Descrição</span>
              <span class="num">Valor</span>
              <span>Categoria</span>
            </div>
            <div
              v-for="r in preview"
              :key="r.id"
              class="prev__row"
              :class="{ 'is-off': !r.incluir }"
            >
              <span>
                <input type="checkbox" v-model="r.incluir" :disabled="!r.categoryId" />
              </span>
              <span class="desc">
                {{ r.descricao }}
                <OrenBadge v-if="r.isCartao" variant="info">cartão</OrenBadge>
                <OrenBadge v-if="!r.sugerida" variant="neutral">sem sugestão</OrenBadge>
              </span>
              <span class="num">{{ formatBRL(r.valor) }}</span>
              <span>
                <OrenSelect v-model="r.categoryId" :options="categoriaOptions" />
              </span>
            </div>
          </div>
        </div>
      </template>
    </div>

    <template #footer="{ close }">
      <span v-if="selecionadas.length" class="footer-total">
        {{ selecionadas.length }} selecionado(s)
      </span>
      <OrenButton variant="ghost" @click="close">Cancelar</OrenButton>
      <OrenButton
        variant="primary"
        :loading="saving"
        :disabled="selecionadas.length === 0"
        @click="confirmar"
      >
        Categorizar
      </OrenButton>
    </template>
  </OrenModal>
</template>

<style scoped>
.cat {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}
.hint {
  margin: 0;
  font-size: 13px;
  color: var(--text-muted);
}
.bulk {
  display: flex;
  gap: 8px;
}
.prev-scroll {
  overflow: auto;
  max-height: 46vh;
  border: 1px solid var(--border-default);
  border-radius: var(--radius);
}
.prev {
  min-width: 520px;
}
.prev__head,
.prev__row {
  display: grid;
  grid-template-columns: 32px 1fr 100px 180px;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
}
.prev__head {
  position: sticky;
  top: 0;
  background: var(--surface-raised);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border-default);
}
.prev__row {
  border-bottom: 1px solid var(--border-subtle, var(--border-default));
  font-size: 13px;
}
.prev__row.is-off {
  opacity: 0.5;
}
.desc {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.footer-total {
  margin-right: auto;
  font-size: 13px;
  color: var(--text-muted);
}
</style>
