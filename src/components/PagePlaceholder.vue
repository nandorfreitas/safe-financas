<script setup lang="ts">
import { OrenPage, OrenAlert } from "@oren/design-system";

defineProps<{
  subtitle?: string;
  title: string;
  description?: string;
  /** O que esta tela fará quando implementada. */
  todo?: string;
}>();
</script>

<template>
  <OrenPage :subtitle="subtitle" :title="title" :description="description">
    <div class="page-pad">
      <OrenAlert feedback="info">
        Tela estruturada — implementação no próximo marco.
        <template v-if="todo"><br />{{ todo }}</template>
      </OrenAlert>
      <slot />
    </div>
  </OrenPage>
</template>
