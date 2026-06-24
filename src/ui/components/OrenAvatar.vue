<script setup lang="ts">
import type { AvatarTone, Size } from "../types";

withDefaults(
  defineProps<{ size?: Size; tone?: AvatarTone; label?: string }>(),
  { size: "md", tone: "primary" },
);
</script>

<template>
  <span :class="['oren-avatar', `oren-avatar--${size}`, `oren-avatar--${tone}`]">
    <slot>{{ label }}</slot>
  </span>
</template>

<style scoped>
.oren-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-family: var(--font-family);
  font-weight: 600;
}
.oren-avatar--sm {
  width: 30px;
  height: 30px;
  font-size: 12px;
}
.oren-avatar--md {
  width: 42px;
  height: 42px;
  font-size: 15px;
}
.oren-avatar--lg {
  width: 56px;
  height: 56px;
  font-size: 19px;
}
.oren-avatar--primary {
  background: var(--green-itaville);
  color: #fff;
}
.oren-avatar--soft {
  background: var(--green-soft);
  color: #fff;
}
.oren-avatar--light {
  background: var(--green-light);
  color: var(--green-darkest);
}
</style>
