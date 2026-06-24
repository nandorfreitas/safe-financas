import { useAuthStore } from "@/stores/auth";
import { useWorkspaceStore } from "@/stores/workspace";

/** Contexto de escrita: workspace ativo + uid do autor. Lança se faltar. */
export function ctx(): { wsId: string; uid: string } {
  const wsId = useWorkspaceStore().activeId;
  const uid = useAuthStore().uid;
  if (!wsId) throw new Error("Nenhum workspace ativo.");
  if (!uid) throw new Error("Usuário não autenticado.");
  return { wsId, uid };
}
