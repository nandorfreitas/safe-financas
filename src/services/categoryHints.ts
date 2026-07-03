/**
 * Dicas de categorização aprendidas com o uso: mapeiam a chave do comerciante
 * (merchantKey) para a categoria que o usuário confirmou. Reaproveitadas nos
 * próximos imports. Nível de workspace.
 */
import { writeBatch } from "firebase/firestore";
import { db } from "@/firebase";
import { categoryHintRef } from "@/lib/firestore";
import type { CategoryHint } from "@/types/models";
import { ctx } from "./context";

/** Chave segura para id de documento (sem "/"). */
function safeKey(key: string): string {
  return key.replace(/\//g, " ").trim().slice(0, 200);
}

export async function saveCategoryHints(
  entries: { key: string; categoryId: string }[],
): Promise<void> {
  const { wsId } = ctx();
  const vistos = new Set<string>();
  const batch = writeBatch(db);
  let n = 0;
  for (const e of entries) {
    const k = safeKey(e.key);
    if (!k || !e.categoryId || vistos.has(k)) continue;
    vistos.add(k);
    batch.set(categoryHintRef(wsId, k), { categoryId: e.categoryId } as CategoryHint);
    n++;
  }
  if (n > 0) await batch.commit();
}
