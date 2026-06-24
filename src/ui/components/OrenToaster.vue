<script setup lang="ts">
import { useToast } from "../useToast";
import type { Feedback } from "../types";

const { toasts, dismiss } = useToast();

const dot: Record<Feedback, string> = {
  success: "#affa57",
  error: "#ff8b80",
  warning: "#ffce6b",
  info: "#8fb8f0",
};
</script>

<template>
  <Teleport to="body">
    <div class="oren-toaster" aria-live="polite">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="oren-toast"
        role="status"
        @click="dismiss(t.id)"
      >
        <span class="oren-toast__dot" :style="{ background: dot[t.type] }" />
        <span>{{ t.message }}</span>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.oren-toaster {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 1000;
  pointer-events: none;
}
.oren-toast {
  display: flex;
  gap: 10px;
  align-items: center;
  background: var(--green-darkest);
  color: #fff;
  padding: 13px 18px;
  border-radius: 10px;
  font-family: var(--font-family);
  font-size: 14px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
  cursor: pointer;
  pointer-events: auto;
  animation: oren-toast-in 0.25s ease;
}
.oren-toast__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex: none;
}
@keyframes oren-toast-in {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .oren-toast {
    animation: none;
  }
}
</style>
