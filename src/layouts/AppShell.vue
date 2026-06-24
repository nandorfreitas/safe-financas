<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { OrenSidebar, OrenSpinner, OrenButton, OrenInput } from "@/ui";
import { icons } from "@/lib/icons";
import { useAuthStore } from "@/stores/auth";
import { useWorkspaceStore } from "@/stores/workspace";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const wsStore = useWorkspaceStore();

const sidebarOpen = ref(true);
// Drawer no mobile (sidebar vira off-canvas abaixo de 768px).
const mobileOpen = ref(false);
const loading = ref(true);
const newWsName = ref("Meu orçamento");
const creating = ref(false);

// Cada item aponta para uma rota nomeada via sua key.
const groups = [
  {
    title: "Visão geral",
    items: [
      { key: "dashboard", label: "Dashboard", icon: icons.dashboard },
      { key: "transactions", label: "Transações", icon: icons.transactions },
    ],
  },
  {
    title: "Patrimônio",
    items: [
      { key: "accounts", label: "Contas", icon: icons.accounts },
      { key: "cards", label: "Cartões", icon: icons.cards },
      { key: "investments", label: "Investimentos", icon: icons.investments },
    ],
  },
  {
    title: "Organização",
    items: [
      { key: "categories", label: "Categorias", icon: icons.categories },
      { key: "monthly-review", label: "Fechamento", icon: icons.monthlyReview },
      { key: "settings", label: "Configurações", icon: icons.settings },
    ],
  },
];

const activeKey = computed(() => (route.name as string) ?? "dashboard");

function onNavigate(key: string) {
  router.push({ name: key });
  mobileOpen.value = false; // fecha o drawer ao navegar no mobile
}

async function onLogout() {
  await authStore.logout();
  wsStore.reset();
  router.push({ name: "login" });
}

async function onCreateWorkspace() {
  if (!newWsName.value.trim()) return;
  creating.value = true;
  try {
    await wsStore.createWorkspace(newWsName.value.trim());
  } finally {
    creating.value = false;
  }
}

onMounted(async () => {
  try {
    await wsStore.load();
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div v-if="loading" class="shell-center">
    <OrenSpinner />
  </div>

  <!-- Onboarding: usuário ainda não tem workspace. -->
  <div v-else-if="!wsStore.hasWorkspace" class="shell-center">
    <div class="onboarding">
      <h1>Bem-vindo ao Safe Finanças</h1>
      <p>Crie seu primeiro workspace para começar a organizar o orçamento.</p>
      <OrenInput v-model="newWsName" label="Nome do workspace" />
      <OrenButton
        variant="primary"
        :disabled="creating"
        @click="onCreateWorkspace"
      >
        {{ creating ? "Criando…" : "Criar workspace" }}
      </OrenButton>
    </div>
  </div>

  <div v-else class="app-shell" :class="{ 'app-shell--drawer-open': mobileOpen }">
    <!-- Backdrop do drawer (só mobile) -->
    <div class="shell-overlay" @click="mobileOpen = false" />

    <div class="shell-sidebar">
      <OrenSidebar
        v-model="sidebarOpen"
        :active="activeKey"
        :groups="groups"
        title="Safe Finanças"
        :subtitle="wsStore.active?.name"
        :logout-icon="icons.logout"
        @update:active="onNavigate"
        @logout="onLogout"
      />
    </div>

    <div class="app-shell__content">
      <!-- Barra superior (só mobile): hambúrguer + marca -->
      <header class="shell-topbar">
        <button class="shell-burger" aria-label="Abrir menu" @click="mobileOpen = true">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
            <path
              d="M3 6h16M3 11h16M3 16h16"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
            />
          </svg>
        </button>
        <strong class="shell-topbar__title">{{ wsStore.active?.name ?? "Safe Finanças" }}</strong>
      </header>

      <RouterView />
    </div>
  </div>
</template>

<style scoped>
.shell-center {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--surface-subtle);
}
.onboarding {
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 32px;
  background: var(--surface-raised);
  border: 1px solid var(--border-default);
  border-radius: var(--radius);
}
.onboarding h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 400;
}
.onboarding p {
  margin: 0;
  color: var(--text-muted);
  font-size: 14px;
}

/* Wrapper da sidebar: no desktop apenas abraça a largura fixa do menu. */
.shell-sidebar {
  display: flex;
  flex: none;
}

/* Barra superior e backdrop: invisíveis no desktop. */
.shell-topbar {
  display: none;
}
.shell-overlay {
  display: none;
}

/* ── Mobile: a sidebar vira drawer off-canvas ── */
@media (max-width: 768px) {
  .shell-topbar {
    display: flex;
    align-items: center;
    gap: 12px;
    position: sticky;
    top: 0;
    z-index: 20;
    background: var(--surface-raised);
    border-bottom: 1px solid var(--border-default);
    padding: 10px 16px;
    padding-top: calc(10px + env(safe-area-inset-top));
    padding-left: calc(16px + env(safe-area-inset-left));
    padding-right: calc(16px + env(safe-area-inset-right));
  }
  .shell-topbar__title {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-default);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .shell-burger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    flex: none;
    border: none;
    border-radius: var(--radius-control);
    background: none;
    color: var(--text-default);
    cursor: pointer;
  }
  .shell-burger:hover {
    background: var(--surface-subtle);
  }

  .shell-sidebar {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 1000;
    padding-top: env(safe-area-inset-top);
    transform: translateX(-100%);
    transition: transform 0.26s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.3);
  }
  .app-shell--drawer-open .shell-sidebar {
    transform: none;
  }

  .shell-overlay {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 999;
    background: rgba(9, 45, 41, 0.5);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.26s ease;
  }
  .app-shell--drawer-open .shell-overlay {
    opacity: 1;
    pointer-events: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .shell-sidebar,
  .shell-overlay {
    transition: none;
  }
}
</style>
