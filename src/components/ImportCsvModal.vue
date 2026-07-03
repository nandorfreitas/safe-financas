<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { OrenModal, OrenButton, OrenSelect, OrenBadge, OrenToggle, useToast } from "@/ui";
import type { SelectOption } from "@/ui";
import { useCategories, useCategoryHints } from "@/composables/useData";
import { parseCsv, parseValorBR, parseDataBR } from "@/lib/csv";
import { extractPdfText } from "@/lib/pdf";
import { getStatementParser, STATEMENT_PARSERS } from "@/lib/statements";
import { suggestCategoryId, merchantKey, pareceCredito, extractParcela } from "@/lib/categorize";
import { categoryOptions } from "@/lib/categoryTree";
import { importCardPurchases, importHashOf, type ImportRow } from "@/services/transactions";
import { saveCategoryHints } from "@/services/categoryHints";
import { formatBRL } from "@/lib/money";
import { competenciaLabel } from "@/lib/competencia";

const props = defineProps<{
  modelValue: boolean;
  cardId: string;
  diaVencimento: number;
  competencia: string;
  /** importHash dos lançamentos já existentes no cartão (dedup). */
  existingHashes: string[];
  /** Compras comuns da competência (id + valor) — para o modo "substituir". */
  substituiveis: { id: string; valor: number }[];
}>();
const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "imported", n: number): void;
}>();

const toast = useToast();
const categories = useCategories();
const hints = useCategoryHints();

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});
const hashSet = computed(() => new Set(props.existingHashes));
const anoFallback = computed(() => Number(props.competencia.slice(0, 4)));

// ── Estado ──
type Mode = "csv" | "pdf";
const mode = ref<Mode>("csv");
const fileName = ref("");
const lendoPdf = ref(false);
const banco = ref("mercadopago");
const pdfText = ref("");

const bancoOptions = STATEMENT_PARSERS.map((p) => ({ label: p.label, value: p.id }));

// CSV
const headers = ref<string[]>([]);
const rawRows = ref<string[][]>([]);
const mapping = reactive({ data: -1, descricao: -1, valor: -1 });

// Fonte comum (CSV mapeado ou PDF extraído)
interface SourceRow {
  data: Date | null;
  descricao: string;
  valorSigned: number;
  credito: boolean;
  parcelaNum?: number;
  parcelaTotal?: number;
}
const sourceRows = ref<SourceRow[]>([]);
const despesaSign = ref<"neg" | "pos">("neg");
const substituir = ref(false);

interface PreviewRow {
  data: Date | null;
  descricao: string;
  valor: number; // centavos, positivo
  isDespesa: boolean;
  dup: boolean;
  incluir: boolean;
  categoryId: string;
  parcelaNum?: number;
  parcelaTotal?: number;
}
const preview = ref<PreviewRow[]>([]);
const saving = ref(false);

const headerOptions = computed<SelectOption[]>(() =>
  headers.value.map((h, i) => ({ label: h || `Coluna ${i + 1}`, value: String(i) })),
);
const categoriaOptions = computed<SelectOption[]>(() =>
  categoryOptions(categories.value, "despesa", { label: "— sem categoria —" }),
);

function reset() {
  mode.value = "csv";
  fileName.value = "";
  lendoPdf.value = false;
  banco.value = "mercadopago";
  pdfText.value = "";
  headers.value = [];
  rawRows.value = [];
  mapping.data = -1;
  mapping.descricao = -1;
  mapping.valor = -1;
  sourceRows.value = [];
  preview.value = [];
  substituir.value = false;
}

function detectar(re: RegExp): number {
  return headers.value.findIndex((h) => re.test(h.toLowerCase()));
}

async function onFile(ev: Event) {
  const file = (ev.target as HTMLInputElement).files?.[0];
  if (!file) return;
  fileName.value = file.name;
  const isPdf = /\.pdf$/i.test(file.name) || file.type === "application/pdf";

  if (isPdf) {
    mode.value = "pdf";
    headers.value = [];
    lendoPdf.value = true;
    try {
      pdfText.value = await extractPdfText(file);
      reparsePdf();
    } catch (e) {
      toast.error("Falha ao ler o PDF.");
      console.error(e);
      sourceRows.value = [];
    } finally {
      lendoPdf.value = false;
    }
    return;
  }

  mode.value = "csv";
  const reader = new FileReader();
  reader.onload = () => {
    const parsed = parseCsv(String(reader.result ?? ""));
    headers.value = parsed.headers;
    rawRows.value = parsed.rows;
    mapping.data = detectar(/data|dt|date|venc/);
    mapping.descricao = detectar(/descri|hist|lan[çc]|estabele|memo|t[íi]tulo|title|name/);
    mapping.valor = detectar(/valor|quantia|amount|montante|d[ée]bito|debito/);
    computeSourceFromMapping();
    autoSign();
    rebuild();
  };
  reader.readAsText(file);
}

function reparsePdf() {
  const linhas = getStatementParser(banco.value).parse(pdfText.value, anoFallback.value);
  sourceRows.value = linhas.map((l) => ({
    data: l.data,
    descricao: l.descricao,
    valorSigned: l.valor,
    credito: l.credito,
    parcelaNum: l.parcelaNum,
    parcelaTotal: l.parcelaTotal,
  }));
  if (linhas.length === 0) {
    toast.error("Nenhum lançamento reconhecido — tente outro banco/formato.");
  }
  autoSign();
  rebuild();
}

function computeSourceFromMapping() {
  if (mapping.data < 0 || mapping.descricao < 0 || mapping.valor < 0) {
    sourceRows.value = [];
    return;
  }
  const out: SourceRow[] = [];
  for (const r of rawRows.value) {
    const bruto0 = (r[mapping.descricao] ?? "").trim();
    const bruto = parseValorBR(r[mapping.valor] ?? "");
    if (bruto == null || !bruto0) continue;
    const { parcelaNum, parcelaTotal, descricao } = extractParcela(bruto0);
    out.push({
      data: parseDataBR(r[mapping.data] ?? ""),
      descricao,
      valorSigned: bruto,
      credito: pareceCredito(descricao),
      parcelaNum,
      parcelaTotal,
    });
  }
  sourceRows.value = out;
}

function autoSign() {
  let neg = 0;
  let pos = 0;
  for (const r of sourceRows.value) {
    if (r.valorSigned < 0) neg++;
    else if (r.valorSigned > 0) pos++;
  }
  despesaSign.value = neg >= pos && neg > 0 ? "neg" : "pos";
}

function rebuild() {
  const out: PreviewRow[] = [];
  for (const r of sourceRows.value) {
    const isDespesa =
      !r.credito && (despesaSign.value === "neg" ? r.valorSigned < 0 : r.valorSigned > 0);
    const valor = Math.abs(r.valorSigned);
    if (valor === 0 || !r.descricao) continue;
    const dup = r.data
      ? hashSet.value.has(importHashOf(r.data, valor, r.descricao))
      : false;
    out.push({
      data: r.data,
      descricao: r.descricao,
      valor,
      isDespesa,
      dup,
      incluir: isDespesa && !!r.data && (substituir.value || !dup),
      categoryId: suggestCategoryId(r.descricao, categories.value, hints.value),
      parcelaNum: r.parcelaNum,
      parcelaTotal: r.parcelaTotal,
    });
  }
  preview.value = out;
}

// CSV: recomputar fonte ao trocar o mapeamento.
watch(() => [mapping.data, mapping.descricao, mapping.valor], () => {
  if (mode.value === "csv") {
    computeSourceFromMapping();
    rebuild();
  }
});
watch([sourceRows, despesaSign, substituir], rebuild);
// Trocar o banco reprocessa o texto do PDF já lido.
watch(banco, () => {
  if (mode.value === "pdf" && pdfText.value) reparsePdf();
});
watch(open, (v) => {
  if (!v) reset();
});

const selecionadas = computed(() => preview.value.filter((r) => r.incluir && r.data));
const totalSelecionado = computed(() =>
  selecionadas.value.reduce((s, r) => s + r.valor, 0),
);

function fmtData(d: Date | null) {
  return d ? d.toLocaleDateString("pt-BR") : "—";
}

async function confirmar() {
  const linhas = selecionadas.value;
  if (linhas.length === 0) {
    toast.error("Selecione ao menos um lançamento.");
    return;
  }
  saving.value = true;
  try {
    const rows: ImportRow[] = linhas.map((r) => ({
      data: r.data as Date,
      descricao: r.descricao,
      valor: r.valor,
      categoryId: r.categoryId || undefined,
      parcelaNum: r.parcelaNum,
      parcelaTotal: r.parcelaTotal,
    }));
    const n = await importCardPurchases({
      cardId: props.cardId,
      diaVencimento: props.diaVencimento,
      competencia: props.competencia,
      rows,
      remover: substituir.value ? props.substituiveis : undefined,
    });
    // Aprender categorias é secundário — não deve derrubar o import se falhar
    // (ex.: rules do categoryHints ainda não publicadas).
    try {
      await saveCategoryHints(
        linhas
          .filter((r) => r.categoryId)
          .map((r) => ({ key: merchantKey(r.descricao), categoryId: r.categoryId })),
      );
    } catch (e) {
      console.error("Falha ao salvar dicas de categoria (import foi concluído):", e);
    }
    toast.success(`${n} lançamento(s) importado(s).`);
    emit("imported", n);
    open.value = false;
  } catch (e) {
    toast.error("Não foi possível importar.");
    console.error(e);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <OrenModal v-model="open" size="lg" title="Importar fatura (CSV ou PDF)">
    <div class="imp">
      <p class="hint">
        Importa para a fatura de <b>{{ competenciaLabel(competencia) }}</b>. Aceita CSV
        (extrato) ou PDF da fatura. No PDF a extração é aproximada — revise antes de importar.
      </p>

      <label class="file">
        <input type="file" accept=".csv,.pdf,text/csv,application/pdf" @change="onFile" />
      </label>

      <div v-if="mode === 'pdf' && pdfText" class="controls">
        <OrenSelect v-model="banco" label="Banco / formato do PDF" :options="bancoOptions" />
      </div>

      <p v-if="lendoPdf" class="hint">Lendo PDF…</p>

      <template v-if="mode === 'csv' && headers.length">
        <div class="map">
          <OrenSelect
            :model-value="String(mapping.data)"
            label="Coluna: Data"
            :options="headerOptions"
            @update:model-value="(v) => { mapping.data = Number(v); }"
          />
          <OrenSelect
            :model-value="String(mapping.descricao)"
            label="Coluna: Descrição"
            :options="headerOptions"
            @update:model-value="(v) => { mapping.descricao = Number(v); }"
          />
          <OrenSelect
            :model-value="String(mapping.valor)"
            label="Coluna: Valor"
            :options="headerOptions"
            @update:model-value="(v) => { mapping.valor = Number(v); }"
          />
        </div>
      </template>

      <template v-if="sourceRows.length">
        <div v-if="mode === 'csv'" class="controls">
          <OrenSelect
            v-model="despesaSign"
            label="Despesas têm sinal"
            :options="[
              { label: 'Negativo (−)', value: 'neg' },
              { label: 'Positivo (+)', value: 'pos' },
            ]"
          />
        </div>

        <OrenToggle v-if="substituiveis.length" v-model="substituir">
          Substituir as {{ substituiveis.length }} compra(s) já existentes desta competência
        </OrenToggle>

        <div class="prev-scroll">
          <div class="prev">
            <div class="prev__head">
              <span></span>
              <span>Data</span>
              <span>Descrição</span>
              <span class="num">Valor</span>
              <span>Categoria</span>
            </div>
            <div
              v-for="(r, i) in preview"
              :key="i"
              class="prev__row"
              :class="{ 'is-off': !r.incluir }"
            >
              <span><input type="checkbox" v-model="r.incluir" :disabled="!r.data" /></span>
              <span :class="{ warn: !r.data }">{{ r.data ? fmtData(r.data) : "data?" }}</span>
              <span class="desc">
                {{ r.descricao }}
                <OrenBadge v-if="r.parcelaTotal && r.parcelaTotal > 1" variant="info">
                  {{ r.parcelaNum }}/{{ r.parcelaTotal }}
                </OrenBadge>
                <OrenBadge v-if="r.dup" variant="warning">já importado</OrenBadge>
                <OrenBadge v-else-if="!r.isDespesa" variant="neutral">crédito/estorno</OrenBadge>
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
        {{ selecionadas.length }} selecionado(s) · {{ formatBRL(totalSelecionado) }}
      </span>
      <OrenButton variant="ghost" @click="close">Cancelar</OrenButton>
      <OrenButton
        variant="primary"
        :loading="saving"
        :disabled="selecionadas.length === 0"
        @click="confirmar"
      >
        Importar
      </OrenButton>
    </template>
  </OrenModal>
</template>

<style scoped>
.imp {
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
.file input {
  font-size: 14px;
}
.map,
.controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}
.prev-scroll {
  overflow: auto;
  max-height: 42vh;
  border: 1px solid var(--border-default);
  border-radius: var(--radius);
}
.prev {
  min-width: 560px;
}
.prev__head,
.prev__row {
  display: grid;
  grid-template-columns: 32px 90px 1fr 100px 160px;
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
.warn {
  color: #b42318;
}
.footer-total {
  margin-right: auto;
  font-size: 13px;
  color: var(--text-muted);
}
</style>
