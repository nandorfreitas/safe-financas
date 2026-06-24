import { updateDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/firebase";
import { useWorkspaceStore } from "@/stores/workspace";
import { ctx } from "./context";

export async function renameWorkspace(name: string): Promise<void> {
  const wsStore = useWorkspaceStore();
  await updateDoc(wsStore.wsDocRef(), { name });
  await wsStore.load();
}

/** Atualiza o limiar de divergência (fração, ex.: 0.20). */
export async function setLimiarDivergencia(limiar: number): Promise<void> {
  const wsStore = useWorkspaceStore();
  await updateDoc(wsStore.wsDocRef(), { limiarDivergencia: limiar });
  await wsStore.load();
}

export interface InviteResult {
  status: "invited" | "already-member";
  uid: string;
  nome?: string;
}

/**
 * Convida um membro por e-mail via Cloud Function (privilégio: e-mail → uid e
 * escrita nos membros). Recarrega o workspace ao final.
 */
export async function inviteMember(email: string): Promise<InviteResult> {
  const { wsId } = ctx();
  const fn = httpsCallable<{ wsId: string; email: string }, InviteResult>(
    functions,
    "inviteMember",
  );
  const res = await fn({ wsId, email });
  await useWorkspaceStore().load();
  return res.data;
}
