<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  OrenPage,
  OrenCard,
  OrenButton,
  OrenInput,
  OrenBadge,
  useToast,
} from "@oren/design-system";
import { useWorkspaceStore } from "@/stores/workspace";
import { useAuthStore } from "@/stores/auth";
import {
  renameWorkspace,
  setLimiarDivergencia,
  inviteMember,
} from "@/services/workspaceSettings";

const toast = useToast();
const wsStore = useWorkspaceStore();
const authStore = useAuthStore();

const ws = computed(() => wsStore.active);

const membros = computed(() => {
  const m = ws.value?.members ?? {};
  return Object.entries(m).map(([uid, info]) => ({ uid, ...info }));
});

// ── Nome do workspace ──
const nome = ref("");
const salvandoNome = ref(false);
watch(ws, (w) => { nome.value = w?.name ?? ""; }, { immediate: true });

async function salvarNome() {
  if (!nome.value.trim()) {
    toast.error("Informe um nome.");
    return;
  }
  salvandoNome.value = true;
  try {
    await renameWorkspace(nome.value.trim());
    toast.success("Nome atualizado.");
  } catch (e) {
    toast.error("Não foi possível salvar.");
    console.error(e);
  } finally {
    salvandoNome.value = false;
  }
}

// ── Limiar de divergência (em %) ──
const limiarPct = ref(20);
const salvandoLimiar = ref(false);
watch(
  ws,
  (w) => { limiarPct.value = Math.round((w?.limiarDivergencia ?? 0.2) * 100); },
  { immediate: true },
);

async function salvarLimiar() {
  const pct = Number(limiarPct.value);
  if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
    toast.error("Informe um percentual entre 0 e 100.");
    return;
  }
  salvandoLimiar.value = true;
  try {
    await setLimiarDivergencia(pct / 100);
    toast.success("Limiar atualizado.");
  } catch (e) {
    toast.error("Não foi possível salvar.");
    console.error(e);
  } finally {
    salvandoLimiar.value = false;
  }
}

// ── Convite de membro ──
const emailConvite = ref("");
const convidando = ref(false);

async function convidar() {
  const email = emailConvite.value.trim();
  if (!email) {
    toast.error("Informe o e-mail.");
    return;
  }
  convidando.value = true;
  try {
    const res = await inviteMember(email);
    if (res.status === "already-member") {
      toast.info("Essa pessoa já é membro do workspace.");
    } else {
      toast.success(`Convidado: ${res.nome ?? email}.`);
    }
    emailConvite.value = "";
  } catch (e) {
    const msg = (e as { message?: string })?.message ?? "Não foi possível convidar.";
    toast.error(msg);
    console.error(e);
  } finally {
    convidando.value = false;
  }
}
</script>

<template>
  <OrenPage subtitle="Organização" title="Configurações / Workspace">
    <div class="page-pad settings">
      <!-- Nome -->
      <OrenCard>
        <template #title>Workspace</template>
        <div class="row">
          <OrenInput v-model="nome" label="Nome do workspace" />
          <OrenButton variant="secondary" :loading="salvandoNome" @click="salvarNome">
            Salvar
          </OrenButton>
        </div>
      </OrenCard>

      <!-- Membros -->
      <OrenCard>
        <template #title>Membros</template>
        <ul class="membros">
          <li v-for="m in membros" :key="m.uid" class="membro">
            <div>
              <strong>{{ m.nome }}</strong>
              <OrenBadge v-if="m.uid === authStore.uid" variant="accent">você</OrenBadge>
            </div>
            <OrenBadge :variant="m.role === 'owner' ? 'info' : 'neutral'">
              {{ m.role === "owner" ? "Dono" : "Membro" }}
            </OrenBadge>
          </li>
        </ul>

        <div class="row" style="margin-top: 16px">
          <OrenInput
            v-model="emailConvite"
            label="Convidar por e-mail"
            type="email"
            placeholder="pessoa@exemplo.com"
          />
          <OrenButton variant="primary" :loading="convidando" @click="convidar">
            Convidar
          </OrenButton>
        </div>
        <p class="muted">
          A pessoa precisa já ter uma conta no Safe Finanças (mesmo e-mail) para ser
          adicionada.
        </p>
      </OrenCard>

      <!-- Limiar -->
      <OrenCard>
        <template #title>Limiar de divergência</template>
        <p class="muted">
          Percentual da receita prevista a partir do qual o fechamento de mês alerta
          sobre a diferença entre previsto e realizado.
        </p>
        <div class="row">
          <OrenInput v-model.number="limiarPct" label="Limiar (%)" type="number" />
          <OrenButton variant="secondary" :loading="salvandoLimiar" @click="salvarLimiar">
            Salvar
          </OrenButton>
        </div>
      </OrenCard>
    </div>
  </OrenPage>
</template>

<style scoped>
.settings {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 640px;
}
.row {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}
.row > :first-child {
  flex: 1;
}
.membros {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}
.membro {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-subtle, var(--border-default));
}
.membro div {
  display: flex;
  align-items: center;
  gap: 8px;
}
.muted {
  color: var(--text-muted);
  font-size: 13px;
  margin: 12px 0 0;
}
</style>
