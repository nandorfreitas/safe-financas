<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { OrenInput, OrenButton, OrenAlert, OrenTabs } from "@/ui";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const mode = ref<"login" | "signup">("login");
const tabs = [
  { label: "Entrar", value: "login" },
  { label: "Criar conta", value: "signup" },
];

const email = ref("");
const senha = ref("");
const loading = ref(false);
const erro = ref("");

function redirect() {
  const to = (route.query.redirect as string) || "/";
  router.push(to);
}

async function onSubmit() {
  erro.value = "";
  loading.value = true;
  try {
    if (mode.value === "login") {
      await auth.loginWithEmail(email.value, senha.value);
    } else {
      await auth.registerWithEmail(email.value, senha.value);
    }
    redirect();
  } catch (e) {
    erro.value = mapError(e);
  } finally {
    loading.value = false;
  }
}

async function onGoogle() {
  erro.value = "";
  loading.value = true;
  try {
    await auth.loginWithGoogle();
    redirect();
  } catch (e) {
    erro.value = mapError(e);
  } finally {
    loading.value = false;
  }
}

function mapError(e: unknown): string {
  const code = (e as { code?: string })?.code ?? "";
  const map: Record<string, string> = {
    "auth/invalid-credential": "E-mail ou senha inválidos.",
    "auth/invalid-email": "E-mail inválido.",
    "auth/email-already-in-use": "Este e-mail já está cadastrado.",
    "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
    "auth/popup-closed-by-user": "Login com Google cancelado.",
  };
  return map[code] ?? "Não foi possível concluir. Tente novamente.";
}
</script>

<template>
  <div class="login">
    <div class="login__card">
      <header class="login__head">
        <h1>Safe Finanças</h1>
        <p>Controle de orçamento previsto × realizado.</p>
      </header>

      <OrenTabs v-model="mode" :tabs="tabs" />

      <form class="login__form" @submit.prevent="onSubmit">
        <OrenInput v-model="email" label="E-mail" type="email" placeholder="voce@exemplo.com" />
        <OrenInput v-model="senha" label="Senha" type="password" />

        <OrenAlert v-if="erro" feedback="error">{{ erro }}</OrenAlert>

        <OrenButton type="submit" variant="primary" :disabled="loading">
          {{ mode === "login" ? "Entrar" : "Criar conta" }}
        </OrenButton>
      </form>

      <div class="login__divider"><span>ou</span></div>

      <OrenButton variant="secondary" :disabled="loading" @click="onGoogle">
        Continuar com Google
      </OrenButton>
    </div>
  </div>
</template>

<style scoped>
.login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-subtle);
  padding: 24px;
}
.login__card {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 32px;
  background: var(--surface-raised);
  border: 1px solid var(--border-default);
  border-radius: var(--radius);
}
.login__head h1 {
  margin: 0 0 4px;
  font-size: 24px;
  font-weight: 400;
}
.login__head p {
  margin: 0;
  color: var(--text-muted);
  font-size: 14px;
}
.login__form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.login__divider {
  display: flex;
  align-items: center;
  text-align: center;
  color: var(--text-muted);
  font-size: 12px;
}
.login__divider::before,
.login__divider::after {
  content: "";
  flex: 1;
  border-bottom: 1px solid var(--border-default);
}
.login__divider span {
  padding: 0 12px;
}
</style>
