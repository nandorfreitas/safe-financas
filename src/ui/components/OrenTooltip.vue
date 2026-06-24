<script setup lang="ts">
withDefaults(defineProps<{ content?: string }>(), {});
</script>

<template>
  <span class="oren-tip" tabindex="0">
    <slot />
    <span class="oren-tip__text" role="tooltip">
      <slot name="content">{{ content }}</slot>
    </span>
  </span>
</template>

<style scoped>
.oren-tip {
  position: relative;
  display: inline-block;
}
.oren-tip__text {
  visibility: hidden;
  opacity: 0;
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  background: var(--green-darkest);
  color: #fff;
  font-family: var(--font-family);
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 6px;
  white-space: nowrap;
  transition: opacity 0.15s;
  z-index: 5;
}
.oren-tip:hover .oren-tip__text,
.oren-tip:focus-within .oren-tip__text {
  visibility: visible;
  opacity: 1;
}
[data-theme="dark"] .oren-tip__text {
  background: var(--green-itaville);
  border: 1px solid rgba(232, 243, 232, 0.2);
}
@media (prefers-reduced-motion: reduce) {
  .oren-tip__text {
    transition: none;
  }
}
</style>
