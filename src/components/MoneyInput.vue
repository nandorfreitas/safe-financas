<script setup lang="ts">
import { ref, watch } from "vue";
import { OrenInput } from "@/ui";
import { formatCentavos, parseToCentavos } from "@/lib/money";

const props = withDefaults(
  defineProps<{
    /** Valor em centavos (int). */
    modelValue: number;
    label?: string;
    placeholder?: string;
  }>(),
  { placeholder: "0,00" },
);

const emit = defineEmits<{ (e: "update:modelValue", value: number): void }>();

// Texto editável; sincroniza com o valor em centavos.
const texto = ref(props.modelValue ? formatCentavos(props.modelValue) : "");

watch(
  () => props.modelValue,
  (v) => {
    const atual = parseToCentavos(texto.value) ?? 0;
    if (v !== atual) texto.value = v ? formatCentavos(v) : "";
  },
);

function onInput(v: string | number) {
  const s = String(v);
  texto.value = s;
  const centavos = parseToCentavos(s);
  emit("update:modelValue", centavos ?? 0);
}

function onBlur() {
  // Normaliza a exibição ao sair do campo.
  const centavos = parseToCentavos(texto.value);
  texto.value = centavos ? formatCentavos(centavos) : "";
}
</script>

<template>
  <div class="money-input" @focusout="onBlur">
    <OrenInput
      :model-value="texto"
      :label="label"
      :placeholder="placeholder"
      inputmode="decimal"
      @update:model-value="onInput"
    />
  </div>
</template>
