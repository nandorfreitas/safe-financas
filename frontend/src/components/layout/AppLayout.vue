<template>
  <div class="app-layout">
    <AppSidebar />
    <main class="app-layout__main">
      <slot />
    </main>
  </div>
</template>

<script setup>
import AppSidebar from './AppSidebar.vue'
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
}

.app-layout__main {
  flex: 1;
  padding: var(--space-8);
  overflow-y: auto;
  max-width: 1200px;
}

@media (max-width: 768px) {
  .app-layout {
    flex-direction: column;
  }

  .app-layout__main {
    padding: var(--space-4);
  }
}
</style>
