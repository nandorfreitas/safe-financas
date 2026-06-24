<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { OrenSidebar, OrenSpinner, OrenButton, OrenInput } from "@oren/design-system";
import { icons } from "@/lib/icons";
import { useAuthStore } from "@/stores/auth";
import { useWorkspaceStore } from "@/stores/workspace";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const wsStore = useWorkspaceStore();

const sidebarOpen = ref(true);
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

  <div v-else class="app-shell">
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
    <div class="app-shell__content">
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
</style>
