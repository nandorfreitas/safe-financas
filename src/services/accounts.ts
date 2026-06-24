import { addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { accountsRef, accountRef } from "@/lib/firestore";
import type { Account, TipoConta, Visibilidade } from "@/types/models";
import { ctx } from "./context";

export interface AccountInput {
  nome: string;
  tipo: TipoConta;
  saldo: number;
  visibilidade: Visibilidade;
  instituicao?: string;
  tipoInvest?: string;
}

/** Visibilidade default sugerida pelo tipo (seção 9 do escopo). */
export function defaultVisibilidade(tipo: TipoConta): Visibilidade {
  return tipo === "investimento" ? "compartilhada" : "pessoal";
}

export async function createAccount(input: AccountInput): Promise<string> {
  const { wsId, uid } = ctx();
  const data: Omit<Account, "id"> = {
    nome: input.nome,
    tipo: input.tipo,
    saldo: input.saldo,
    donoUid: uid, // fixo na criação
    visibilidade: input.visibilidade,
    arquivada: false,
    ...(input.instituicao ? { instituicao: input.instituicao } : {}),
    ...(input.tipoInvest ? { tipoInvest: input.tipoInvest } : {}),
  };
  const ref = await addDoc(accountsRef(wsId), data as Account);
  return ref.id;
}

export async function updateAccount(
  id: string,
  patch: Partial<Omit<Account, "id" | "donoUid">>,
): Promise<void> {
  const { wsId } = ctx();
  await updateDoc(accountRef(wsId, id), patch);
}

/** Ajuste manual de saldo (a fonte da verdade). */
export async function setSaldo(id: string, saldo: number): Promise<void> {
  const { wsId } = ctx();
  await updateDoc(accountRef(wsId, id), { saldo });
}

export async function setAccountVisibilidade(
  id: string,
  visibilidade: Visibilidade,
): Promise<void> {
  const { wsId } = ctx();
  await updateDoc(accountRef(wsId, id), { visibilidade });
}

export async function setAccountArchived(id: string, arquivada: boolean): Promise<void> {
  const { wsId } = ctx();
  await updateDoc(accountRef(wsId, id), { arquivada });
}

export async function deleteAccount(id: string): Promise<void> {
  const { wsId } = ctx();
  await deleteDoc(accountRef(wsId, id));
}
