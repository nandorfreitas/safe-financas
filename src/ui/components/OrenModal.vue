<script setup lang="ts">
import { watch, onUnmounted } from "vue";

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

function onKey(e: KeyboardEvent) {
  if (e.key === "Escape") close();
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) window.addEventListener("keydown", onKey);
    else window.removeEventListener("keydown", onKey);
  },
);

onUnmounted(() => window.removeEventListener("keydown", onKey));
</script>

<template>
  <Teleport to="body">
    <Transition name="oren-modal-fade">
      <div
        v-if="modelValue"
        class="oren-overlay"
        @click="closeOnOverlay && close()"
      >
        <div
          class="oren-modal"
          role="dialog"
          aria-modal="true"
          @click.stop
        >
          <h3 v-if="title" class="oren-modal__title">{{ title }}</h3>
          <div class="oren-modal__body"><slot /></div>
          <div v-if="$slots.footer" class="oren-modal__footer">
            <slot name="footer" :close="close" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.oren-overlay {
  position: fixed;
  inset: 0;
  background: rgba(9, 45, 41, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 900;
  font-family: var(--font-family);
}
.oren-modal {
  background: var(--surface-raised);
  color: var(--text-default);
  border-radius: 14px;
  padding: 26px;
  max-width: 420px;
  width: calc(100% - 40px);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
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
.oren-modal-fade-enter-active,
.oren-modal-fade-leave-active {
  transition: opacity 0.18s ease;
}
.oren-modal-fade-enter-from,
.oren-modal-fade-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .oren-modal-fade-enter-active,
  .oren-modal-fade-leave-active {
    transition: none;
  }
}
</style>
