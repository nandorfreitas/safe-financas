import { addDoc, updateDoc, deleteDoc, getDocs } from "firebase/firestore";
import { categoriesRef, categoryRef } from "@/lib/firestore";
import type { Category, TipoCategoria } from "@/types/models";
import { ctx } from "./context";

export type CategoryInput = Omit<Category, "id" | "arquivada">;

/**
 * Garante uma categoria com este nome e tipo (cria se não existir) e retorna o id.
 * Usado por módulos que classificam lançamentos automaticamente (ex.: empréstimos).
 */
export async function ensureCategory(
  nome: string,
  tipo: TipoCategoria,
  cor = "#8b5cf6",
): Promise<string> {
  const { wsId } = ctx();
  const snap = await getDocs(categoriesRef(wsId));
  const existing = snap.docs.find((d) => {
    const c = d.data();
    return (
      !c.arquivada &&
      c.tipo === tipo &&
      c.nome.trim().toLowerCase() === nome.trim().toLowerCase()
    );
  });
  if (existing) return existing.id;
  const ref = await addDoc(categoriesRef(wsId), {
    nome,
    tipo,
    cor,
    fixaPorPadrao: false,
    essencialPorPadrao: false,
    arquivada: false,
  } as Category);
  return ref.id;
}

export async function createCategory(input: CategoryInput): Promise<string> {
  const { wsId } = ctx();
  const ref = await addDoc(categoriesRef(wsId), {
    ...input,
    arquivada: false,
  } as Category);
  return ref.id;
}

export async function updateCategory(
  id: string,
  patch: Partial<CategoryInput>,
): Promise<void> {
  const { wsId } = ctx();
  await updateDoc(categoryRef(wsId, id), patch);
}

export async function setCategoryArchived(id: string, arquivada: boolean): Promise<void> {
  const { wsId } = ctx();
  await updateDoc(categoryRef(wsId, id), { arquivada });
}

export async function deleteCategory(id: string): Promise<void> {
  const { wsId } = ctx();
  await deleteDoc(categoryRef(wsId, id));
}
