import { addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { cardsRef, cardRef } from "@/lib/firestore";
import type { Card, Visibilidade } from "@/types/models";
import { ctx } from "./context";

export interface CardInput {
  nome: string;
  limite?: number;
  diaVencimento: number;
  bandeira?: string;
  visibilidade: Visibilidade;
}

/** Cartão é compartilhado por padrão (seção 9 do escopo). */
export function defaultCardVisibilidade(): Visibilidade {
  return "compartilhada";
}

export async function createCard(input: CardInput): Promise<string> {
  const { wsId, uid } = ctx();
  const data: Omit<Card, "id"> = {
    nome: input.nome,
    diaVencimento: input.diaVencimento,
    donoUid: uid, // fixo na criação
    visibilidade: input.visibilidade,
    arquivado: false,
    ...(input.limite != null ? { limite: input.limite } : {}),
    ...(input.bandeira ? { bandeira: input.bandeira } : {}),
  };
  const ref = await addDoc(cardsRef(wsId), data as Card);
  return ref.id;
}

export async function updateCard(
  id: string,
  patch: Partial<Omit<Card, "id" | "donoUid">>,
): Promise<void> {
  const { wsId } = ctx();
  await updateDoc(cardRef(wsId, id), patch);
}

export async function setCardVisibilidade(
  id: string,
  visibilidade: Visibilidade,
): Promise<void> {
  const { wsId } = ctx();
  await updateDoc(cardRef(wsId, id), { visibilidade });
}

export async function setCardArchived(id: string, arquivado: boolean): Promise<void> {
  const { wsId } = ctx();
  await updateDoc(cardRef(wsId, id), { arquivado });
}

export async function deleteCard(id: string): Promise<void> {
  const { wsId } = ctx();
  await deleteDoc(cardRef(wsId, id));
}
