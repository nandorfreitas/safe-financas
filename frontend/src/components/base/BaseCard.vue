<template>
  <div :class="['base-card', { 'base-card--hoverable': hoverable }]">
    <div v-if="title || $slots.header" class="base-card__header">
      <slot name="header">
        <h4 class="base-card__title">{{ title }}</h4>
        <p v-if="subtitle" class="base-card__subtitle">{{ subtitle }}</p>
      </slot>
    </div>
    <div class="base-card__body">
      <slot />
    </div>
    <div v-if="$slots.footer" class="base-card__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  hoverable: { type: Boolean, default: false }
})
</script>

<style scoped>
.base-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--card-shadow);
  overflow: hidden;
  transition: box-shadow var(--duration-normal) var(--easing-default),
              transform var(--duration-normal) var(--easing-default);
}

.base-card--hoverable:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.base-card__header {
  padding: var(--space-5) var(--space-6) 0;
}

.base-card__title {
  font-size: var(--text-md);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.base-card__subtitle {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-top: var(--space-1);
}

.base-card__body {
  padding: var(--space-5) var(--space-6);
}

.base-card__footer {
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--border-subtle);
}
</style>
