/**
 * Utilidades de hierarquia de categorias (pai → subcategoria via parentId).
 * Simples: só um nível de profundidade é esperado, mas resolveTop é robusto.
 */
import type { Category, TipoCategoria } from "@/types/models";
import type { SelectOption } from "@/ui";

/** Opções para <OrenSelect>, com subcategorias indentadas sob o pai. */
export function categoryOptions(
  categories: Category[],
  tipo: TipoCategoria,
  empty?: { label: string; value?: string },
): SelectOption[] {
  const ativas = categories.filter((c) => c.tipo === tipo && !c.arquivada);
  const byNome = (a: Category, b: Category) => a.nome.localeCompare(b.nome);
  const tops = ativas.filter((c) => !c.parentId).sort(byNome);
  const subsDe = (id?: string) => ativas.filter((c) => c.parentId === id).sort(byNome);

  const opts: SelectOption[] = [];
  if (empty) opts.push({ label: empty.label, value: empty.value ?? "" });
  for (const t of tops) {
    opts.push({ label: t.nome, value: t.id ?? "" });
    for (const s of subsDe(t.id)) opts.push({ label: `  ↳ ${s.nome}`, value: s.id ?? "" });
  }
  // Subcategorias órfãs (pai arquivado/removido) — não somem da lista.
  const idsTop = new Set(tops.map((t) => t.id));
  for (const c of ativas) {
    if (c.parentId && !idsTop.has(c.parentId)) opts.push({ label: c.nome, value: c.id ?? "" });
  }
  return opts;
}

/** Resolve uma categoria à sua raiz (categoria de topo). Para agregações. */
export function resolveTop(categories: Category[], id?: string): Category | null {
  if (!id) return null;
  const map = new Map(categories.map((c) => [c.id, c]));
  let atual = map.get(id) ?? null;
  const visto = new Set<string>();
  while (atual?.parentId && !visto.has(atual.id ?? "")) {
    visto.add(atual.id ?? "");
    const pai = map.get(atual.parentId);
    if (!pai) break;
    atual = pai;
  }
  return atual;
}

/** Nome com caminho "Pai › Sub" (ou só o nome se for topo). */
export function categoryPath(categories: Category[], id?: string): string {
  if (!id) return "—";
  const map = new Map(categories.map((c) => [c.id, c]));
  const c = map.get(id);
  if (!c) return "—";
  if (c.parentId) {
    const pai = map.get(c.parentId);
    if (pai) return `${pai.nome} › ${c.nome}`;
  }
  return c.nome;
}
