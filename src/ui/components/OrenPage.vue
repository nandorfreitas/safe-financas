<script setup lang="ts">
defineProps<{
  /** Título principal da página. */
  title?: string;
  /** Rótulo de seção exibido acima do título (maiúsculas, verde). */
  subtitle?: string;
  /** Descrição opcional exibida abaixo do título. */
  description?: string;
}>();
</script>

<template>
  <div class="op">
    <header class="op__header">
      <div class="op__heading">
        <div v-if="$slots.breadcrumb" class="op__breadcrumb">
          <slot name="breadcrumb" />
        </div>
        <p v-else-if="subtitle" class="op__eyebrow">{{ subtitle }}</p>
        <h1 v-if="title" class="op__title">{{ title }}</h1>
        <p v-if="description" class="op__desc">{{ description }}</p>
        <slot name="header" />
      </div>
      <div v-if="$slots.actions" class="op__actions">
        <slot name="actions" />
      </div>
    </header>
    <main class="op__body">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.op {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--surface-default);
  overflow-y: auto;
  font-family: var(--font-family);
}

.op__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding: 28px 40px 24px;
  background: var(--surface-default);
  border-bottom: 1px solid var(--border-subtle);
  flex: none;
}

.op__heading {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.op__breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  font-size: 12px;
  color: var(--text-muted);
}

.op__eyebrow {
  margin: 0 0 4px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--green-medium);
}

.op__title {
  margin: 0;
  font-size: 26px;
  font-weight: 300;
  color: var(--green-darkest);
  line-height: 1.15;
}

.op__desc {
  margin: 6px 0 0;
  font-size: 13.5px;
  color: var(--text-muted);
  line-height: 1.5;
}

.op__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
  padding-top: 4px;
}

.op__body {
  flex: 1;
  padding: 0 40px 32px 40px;
  min-height: 0;
}

[data-theme="dark"] .op {
  background: var(--surface-default);
}

[data-theme="dark"] .op__header {
  background: var(--surface-default);
  border-bottom-color: var(--border-subtle);
}

[data-theme="dark"] .op__title {
  color: var(--text-default);
}
</style>
