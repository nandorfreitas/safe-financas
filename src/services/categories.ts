import { addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { categoriesRef, categoryRef } from "@/lib/firestore";
import type { Category } from "@/types/models";
import { ctx } from "./context";

export type CategoryInput = Omit<Category, "id" | "arquivada">;

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
