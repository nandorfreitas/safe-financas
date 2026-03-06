<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="confirm-overlay" @click.self="cancel">
        <div class="confirm-dialog" role="dialog" aria-modal="true">
          <div class="confirm-dialog__icon" :class="`confirm-dialog__icon--${variant}`">
            <svg v-if="variant === 'danger'" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <svg v-else width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h3 class="confirm-dialog__title">{{ title }}</h3>
          <p v-if="message" class="confirm-dialog__message">{{ message }}</p>
          <div class="confirm-dialog__actions">
            <button
              v-for="action in actions"
              :key="action.value"
              :class="['confirm-dialog__btn', `confirm-dialog__btn--${action.variant || 'secondary'}`]"
              @click="select(action.value)"
            >
              {{ action.label }}
            </button>
          </div>
          <button class="confirm-dialog__cancel" @click="cancel">Cancelar</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: 'Confirmar ação' },
  message: { type: String, default: '' },
  variant: { type: String, default: 'info' },
  actions: {
    type: Array,
    default: () => [
      { label: 'Confirmar', value: 'confirm', variant: 'primary' }
    ]
  }
})

const emit = defineEmits(['update:modelValue', 'select'])

function select(value) {
  emit('select', value)
  emit('update:modelValue', false)
}

function cancel() {
  emit('update:modelValue', false)
}
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: var(--modal-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: var(--space-4);
}

.confirm-dialog {
  background: var(--modal-bg);
  border: 1px solid var(--modal-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--modal-shadow);
  width: 100%;
  max-width: 420px;
  padding: var(--space-8) var(--space-6) var(--space-6);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.confirm-dialog__icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-4);
}

.confirm-dialog__icon--danger {
  background: var(--color-danger-subtle);
  color: var(--color-danger);
}

.confirm-dialog__icon--info {
  background: var(--color-info-subtle);
  color: var(--color-info);
}

.confirm-dialog__icon--warning {
  background: var(--color-warning-subtle);
  color: var(--color-warning);
}

.confirm-dialog__title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.confirm-dialog__message {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-6);
  max-width: 320px;
}

.confirm-dialog__actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 100%;
}

.confirm-dialog__btn {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all var(--duration-normal) var(--easing-default);
  border: 1px solid transparent;
}

.confirm-dialog__btn--primary {
  background: var(--btn-primary-bg);
  color: var(--btn-primary-text);
}

.confirm-dialog__btn--primary:hover {
  background: var(--btn-primary-bg-hover);
}

.confirm-dialog__btn--danger {
  background: var(--btn-danger-bg);
  color: var(--btn-danger-text);
}

.confirm-dialog__btn--danger:hover {
  background: var(--btn-danger-bg-hover);
}

.confirm-dialog__btn--secondary {
  background: var(--btn-secondary-bg);
  color: var(--btn-secondary-text);
  border-color: var(--btn-secondary-border);
}

.confirm-dialog__btn--secondary:hover {
  background: var(--btn-secondary-bg-hover);
}

.confirm-dialog__cancel {
  margin-top: var(--space-3);
  padding: var(--space-2) var(--space-4);
  background: none;
  border: none;
  color: var(--text-tertiary);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: color var(--duration-normal) var(--easing-default);
}

.confirm-dialog__cancel:hover {
  color: var(--text-primary);
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity var(--duration-slow) var(--easing-default);
}

.modal-enter-active .confirm-dialog,
.modal-leave-active .confirm-dialog {
  transition: transform var(--duration-slow) var(--easing-spring),
              opacity var(--duration-slow) var(--easing-default);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .confirm-dialog {
  transform: scale(0.92) translateY(12px);
  opacity: 0;
}

.modal-leave-to .confirm-dialog {
  transform: scale(0.92) translateY(12px);
  opacity: 0;
}
</style>
