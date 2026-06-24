<script setup lang="ts">
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  VisuallyHidden,
} from "reka-ui";

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    title?: string;
    closeOnOverlay?: boolean;
  }>(),
  { closeOnOverlay: true },
);

const emit = defineEmits<{ (e: "update:modelValue", value: boolean): void }>();

function close() {
  emit("update:modelValue", false);
}

// Quando closeOnOverlay = false, impede o fechamento por clique fora.
function onOutside(e: Event) {
  if (!props.closeOnOverlay) e.preventDefault();
}
</script>

<template>
  <DialogRoot :open="modelValue" @update:open="emit('update:modelValue', $event)">
    <DialogPortal>
      <DialogOverlay class="oren-overlay" />
      <DialogContent
        class="oren-modal"
        :aria-describedby="undefined"
        @pointer-down-outside="onOutside"
        @interact-outside="onOutside"
      >
        <DialogTitle v-if="title" class="oren-modal__title">{{ title }}</DialogTitle>
        <VisuallyHidden v-else as-child>
          <DialogTitle>Diálogo</DialogTitle>
        </VisuallyHidden>

        <div class="oren-modal__body"><slot /></div>
        <div v-if="$slots.footer" class="oren-modal__footer">
          <slot name="footer" :close="close" />
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style>
/* Conteúdo é teleportado para o body (fora do escopo) — estilos globais. */
.oren-overlay {
  position: fixed;
  inset: 0;
  background: rgba(9, 45, 41, 0.55);
  z-index: 900;
}
.oren-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 901;
  font-family: var(--font-family);
  background: var(--surface-raised);
  color: var(--text-default);
  border-radius: 14px;
  padding: 26px;
  max-width: 420px;
  width: calc(100% - 40px);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}
.oren-modal:focus {
  outline: none;
}
.oren-modal__title {
  font-size: 19px;
  font-weight: 700;
  margin: 0 0 8px;
}
.oren-modal__body {
  font-size: 14px;
  color: var(--text-muted);
}
.oren-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

/* Animações de entrada/saída (Reka mantém o nó montado durante a saída). */
.oren-overlay[data-state="open"] {
  animation: oren-fade-in 0.18s ease;
}
.oren-overlay[data-state="closed"] {
  animation: oren-fade-out 0.18s ease;
}
.oren-modal[data-state="open"] {
  animation: oren-fade-in 0.18s ease;
}
.oren-modal[data-state="closed"] {
  animation: oren-fade-out 0.18s ease;
}
@keyframes oren-fade-in {
  from {
    opacity: 0;
  }
}
@keyframes oren-fade-out {
  to {
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .oren-overlay[data-state],
  .oren-modal[data-state] {
    animation: none;
  }
}
</style>
