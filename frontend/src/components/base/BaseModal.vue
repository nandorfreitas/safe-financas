<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="base-modal__overlay" @click.self="close">
        <div :class="['base-modal', `base-modal--${size}`]" role="dialog" aria-modal="true">
          <div class="base-modal__header">
            <h3 class="base-modal__title">{{ title }}</h3>
            <button class="base-modal__close" @click="close" aria-label="Fechar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="base-modal__body">
            <slot />
          </div>
          <div v-if="$slots.footer" class="base-modal__footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  size: { type: String, default: 'md', validator: v => ['sm', 'md', 'lg'].includes(v) }
})

const emit = defineEmits(['update:modelValue'])

function close() {
  emit('update:modelValue', false)
}
</script>

<style scoped>
.base-modal__overlay {
  position: fixed;
  inset: 0;
  background: var(--modal-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: var(--space-4);
}

.base-modal {
  background: var(--modal-bg);
  border: 1px solid var(--modal-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--modal-shadow);
  width: 100%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.base-modal--sm { max-width: 400px; }
.base-modal--md { max-width: 560px; }
.base-modal--lg { max-width: 720px; }

.base-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--border-subtle);
}

.base-modal__title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.base-modal__close {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  color: var(--text-tertiary);
  transition: all var(--duration-normal) var(--easing-default);
}

.base-modal__close:hover {
  background: var(--bg-muted);
  color: var(--text-primary);
}

.base-modal__body {
  padding: var(--space-6);
  overflow-y: auto;
}

.base-modal__footer {
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--border-subtle);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity var(--duration-slow) var(--easing-default);
}

.modal-enter-active .base-modal,
.modal-leave-active .base-modal {
  transition: transform var(--duration-slow) var(--easing-spring),
              opacity var(--duration-slow) var(--easing-default);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .base-modal {
  transform: scale(0.96) translateY(8px);
  opacity: 0;
}

.modal-leave-to .base-modal {
  transform: scale(0.96) translateY(8px);
  opacity: 0;
}
</style>
