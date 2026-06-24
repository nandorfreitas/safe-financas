<script setup lang="ts">
withDefaults(
  defineProps<{ size?: number; variant?: "brand" | "ring"; label?: string }>(),
  { size: 48, variant: "brand", label: "Carregando" },
);

const PETALS = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
</script>

<template>
  <span
    v-if="variant === 'ring'"
    class="oren-ring"
    role="status"
    :aria-label="label"
    :style="{ width: size + 'px', height: size + 'px' }"
  />
  <span
    v-else
    class="oren-spinner"
    role="status"
    :aria-label="label"
    :style="{ width: size + 'px', height: size + 'px' }"
  >
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <linearGradient id="oren-spinner-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#affa57" />
          <stop offset="0.5" stop-color="#20b994" />
          <stop offset="1" stop-color="#0e5351" />
        </linearGradient>
      </defs>
      <g fill="url(#oren-spinner-grad)">
        <ellipse
          v-for="a in PETALS"
          :key="a"
          cx="50"
          cy="15"
          rx="4"
          ry="9.5"
          :transform="`rotate(${a} 50 50)`"
        />
      </g>
    </svg>
  </span>
</template>

<style scoped>
.oren-spinner {
  display: inline-block;
}
.oren-spinner svg {
  width: 100%;
  height: 100%;
  animation: oren-spin-rotate 2.4s linear infinite;
  transform-origin: center;
}
.oren-ring {
  display: inline-block;
  border-radius: 50%;
  border: 3px solid var(--gray-200);
  border-top-color: var(--green-soft);
  animation: oren-spin-rotate 0.8s linear infinite;
}
[data-theme="dark"] .oren-ring {
  border-color: rgba(232, 243, 232, 0.18);
  border-top-color: var(--green-light);
}
@keyframes oren-spin-rotate {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .oren-spinner svg,
  .oren-ring {
    animation-duration: 3s;
  }
}
</style>
