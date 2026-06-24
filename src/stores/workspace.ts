import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/firebase";
import type { Workspace } from "@/types/models";
import { useAuthStore } from "./auth";

const ACTIVE_WS_KEY = "safe-financas:activeWorkspaceId";

export const useWorkspaceStore = defineStore("workspace", () => {
  const workspaces = ref<Workspace[]>([]);
  const activeId = ref<string | null>(localStorage.getItem(ACTIVE_WS_KEY));
  const loaded = ref(false);

  const active = computed(
    () => workspaces.value.find((w) => w.id === activeId.value) ?? null,
  );
  const hasWorkspace = computed(() => workspaces.value.length > 0);

  /** Carrega todos os workspaces de que o usuário é membro. */
  async function load() {
    const authStore = useAuthStore();
    if (!authStore.uid) return;

    const q = query(
      collection(db, "workspaces"),
      where("memberUids", "array-contains", authStore.uid),
    );
    const snap = await getDocs(q);
    workspaces.value = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Workspace, "id">),
    }));

    // Garante um workspace ativo válido.
    if (!activeId.value || !workspaces.value.some((w) => w.id === activeId.value)) {
      setActive(workspaces.value[0]?.id ?? null);
    }
    loaded.value = true;
  }

  function setActive(id: string | null) {
    activeId.value = id;
    if (id) localStorage.setItem(ACTIVE_WS_KEY, id);
    else localStorage.removeItem(ACTIVE_WS_KEY);
  }

  /** Cria o primeiro workspace do usuário (onboarding). */
  async function createWorkspace(name: string): Promise<string> {
    const authStore = useAuthStore();
    const uid = authStore.uid;
    if (!uid) throw new Error("Não autenticado.");

    const nome = authStore.user?.displayName ?? authStore.user?.email ?? "Eu";
    const data: Omit<Workspace, "id" | "createdAt"> & { createdAt: unknown } = {
      name,
      ownerUid: uid,
      memberUids: [uid],
      members: { [uid]: { role: "owner", nome } },
      limiarDivergencia: 0.2,
      createdAt: serverTimestamp(),
    };
    const ref = await addDoc(collection(db, "workspaces"), data);
    await load();
    setActive(ref.id);
    return ref.id;
  }

  /** Caminho base da subcoleção, ex.: collection(db, wsPath('accounts')). */
  function wsPath(sub: string) {
    if (!activeId.value) throw new Error("Nenhum workspace ativo.");
    return `workspaces/${activeId.value}/${sub}`;
  }

  function wsDocRef() {
    if (!activeId.value) throw new Error("Nenhum workspace ativo.");
    return doc(db, "workspaces", activeId.value);
  }

  function reset() {
    workspaces.value = [];
    loaded.value = false;
  }

  return {
    workspaces,
    activeId,
    active,
    loaded,
    hasWorkspace,
    load,
    setActive,
    createWorkspace,
    wsPath,
    wsDocRef,
    reset,
  };
});
