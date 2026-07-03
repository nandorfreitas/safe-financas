import { addDoc, updateDoc, deleteDoc, deleteField, getDocs } from "firebase/firestore";
import { categoriesRef, categoryRef } from "@/lib/firestore";
import type { Category, TipoCategoria } from "@/types/models";
import { normalizeText } from "@/lib/categorize";
import { ctx } from "./context";

export type CategoryInput = Omit<Category, "id" | "arquivada">;

/** Remove chaves undefined (Firestore rejeita undefined). */
function clean<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as T;
}

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
  const ref = await addDoc(
    categoriesRef(wsId),
    clean({ ...input, arquivada: false }) as Category,
  );
  return ref.id;
}

export async function updateCategory(
  id: string,
  patch: Omit<Partial<CategoryInput>, "parentId"> & { parentId?: string | null },
): Promise<void> {
  const { wsId } = ctx();
  const out: Record<string, unknown> = { ...patch };
  // parentId null/"" → remove (vira categoria de topo).
  if ("parentId" in patch) {
    out.parentId = patch.parentId ? patch.parentId : deleteField();
  }
  await updateDoc(categoryRef(wsId, id), clean(out));
}

// ── Taxonomia sugerida (seed) ──────────────────────────────────────────────
interface SeedCat {
  nome: string;
  cor: string;
  essencial?: boolean;
  fixa?: boolean;
  subs?: string[];
}
const SEED_DESPESA: SeedCat[] = [
  { nome: "Alimentação", cor: "#e67e22", essencial: true, subs: ["Mercado", "Hortifruti", "Padaria", "Restaurante", "Delivery", "Lanches/Café"] },
  { nome: "Transporte", cor: "#2980b9", subs: ["Combustível", "Pedágio/Estacionamento", "App/Táxi", "Manutenção"] },
  { nome: "Moradia", cor: "#8e44ad", essencial: true, fixa: true, subs: ["Aluguel/Financiamento", "Condomínio", "Energia", "Água", "Gás", "Internet/TV"] },
  { nome: "Saúde", cor: "#27ae60", essencial: true, subs: ["Farmácia", "Consultas/Exames", "Plano de saúde", "Academia"] },
  { nome: "Compras", cor: "#d35400", subs: ["Vestuário", "Eletrônicos", "Casa/Utilidades", "Marketplace"] },
  { nome: "Lazer", cor: "#c0392b", subs: ["Streaming", "Eventos/Ingressos", "Bares", "Hobbies"] },
  { nome: "Pets", cor: "#16a085" },
  { nome: "Viagem", cor: "#2c3e50", subs: ["Passagens", "Hospedagem", "Alimentação", "Transporte local", "Passeios", "Compras"] },
  { nome: "Educação", cor: "#34495e", subs: ["Cursos", "Livros/Escola"] },
  { nome: "Financeiro", cor: "#7f8c8d", subs: ["Tarifas", "Juros/Encargos", "Impostos"] },
  { nome: "Outros", cor: "#95a5a6" },
];
const SEED_RECEITA = ["Salário", "Renda extra", "Rendimentos", "Reembolsos", "Outros"];

/**
 * Cria a taxonomia sugerida, pulando o que já existe (por nome/tipo/pai).
 * Retorna quantas categorias foram criadas.
 */
export async function createSuggestedCategories(existentes: Category[]): Promise<number> {
  const ativos = existentes.filter((c) => !c.arquivada);
  const acha = (nome: string, tipo: TipoCategoria, parentId?: string) =>
    ativos.find(
      (c) =>
        c.tipo === tipo &&
        normalizeText(c.nome) === normalizeText(nome) &&
        (c.parentId ?? null) === (parentId ?? null),
    );
  let n = 0;

  for (const p of SEED_DESPESA) {
    let parentId = acha(p.nome, "despesa")?.id;
    if (!parentId) {
      parentId = await createCategory({
        nome: p.nome,
        tipo: "despesa",
        cor: p.cor,
        fixaPorPadrao: !!p.fixa,
        essencialPorPadrao: !!p.essencial,
      });
      n++;
    }
    for (const sub of p.subs ?? []) {
      if (acha(sub, "despesa", parentId)) continue;
      await createCategory({
        nome: sub,
        tipo: "despesa",
        parentId,
        cor: p.cor,
        fixaPorPadrao: !!p.fixa,
        essencialPorPadrao: !!p.essencial,
      });
      n++;
    }
  }
  for (const r of SEED_RECEITA) {
    if (acha(r, "receita")) continue;
    await createCategory({
      nome: r,
      tipo: "receita",
      cor: "#1f7a4d",
      fixaPorPadrao: false,
      essencialPorPadrao: false,
    });
    n++;
  }
  return n;
}

export async function setCategoryArchived(id: string, arquivada: boolean): Promise<void> {
  const { wsId } = ctx();
  await updateDoc(categoryRef(wsId, id), { arquivada });
}

export async function deleteCategory(id: string): Promise<void> {
  const { wsId } = ctx();
  await deleteDoc(categoryRef(wsId, id));
}
