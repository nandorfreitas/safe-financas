import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";

initializeApp();

interface InviteMemberData {
  wsId: string;
  email: string;
}

/**
 * Convida um membro por e-mail para um workspace.
 *
 * Único caso de Fase 1 que exige privilégio: traduzir e-mail → uid (precisa do
 * Admin SDK) e escrever no array de membros de OUTRO usuário (que as Security
 * Rules client-side não permitiriam).
 *
 * Regras de negócio:
 * - O chamador precisa estar autenticado e ser MEMBRO do workspace.
 * - O e-mail precisa corresponder a uma conta Firebase existente.
 * - Idempotente: reconvidar um membro existente não duplica.
 */
export const inviteMember = onCall<InviteMemberData>(async (request) => {
  const auth = request.auth;
  if (!auth) {
    throw new HttpsError("unauthenticated", "Faça login para convidar membros.");
  }

  const { wsId, email } = request.data ?? ({} as InviteMemberData);
  if (!wsId || !email) {
    throw new HttpsError("invalid-argument", "wsId e email são obrigatórios.");
  }

  const db = getFirestore();
  const wsRef = db.doc(`workspaces/${wsId}`);
  const wsSnap = await wsRef.get();
  if (!wsSnap.exists) {
    throw new HttpsError("not-found", "Workspace não encontrado.");
  }

  const ws = wsSnap.data() as {
    memberUids: string[];
    members: Record<string, { role: string; nome: string }>;
  };

  // Só membros podem convidar.
  if (!ws.memberUids.includes(auth.uid)) {
    throw new HttpsError("permission-denied", "Você não é membro deste workspace.");
  }

  // Resolve e-mail → uid.
  let invited;
  try {
    invited = await getAuth().getUserByEmail(email.trim().toLowerCase());
  } catch {
    throw new HttpsError(
      "not-found",
      "Nenhuma conta encontrada com este e-mail. Peça para a pessoa criar uma conta primeiro.",
    );
  }

  if (ws.memberUids.includes(invited.uid)) {
    return { status: "already-member", uid: invited.uid };
  }

  const nome = invited.displayName ?? invited.email ?? "Convidado";
  await wsRef.update({
    memberUids: FieldValue.arrayUnion(invited.uid),
    [`members.${invited.uid}`]: { role: "member", nome },
  });

  return { status: "invited", uid: invited.uid, nome };
});
