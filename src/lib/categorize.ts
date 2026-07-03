/**
 * Categorização automática de lançamentos importados, em camadas:
 * 1) Histórico aprendido (dicas por comerciante) — tem prioridade.
 * 2) Regras por palavra-chave (semente de comerciantes comuns no Brasil),
 *    resolvidas para a categoria do usuário pelo NOME.
 * Tudo offline e determinístico.
 */
import type { Category } from "@/types/models";

export function normalizeText(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Chave do comerciante a partir da descrição do lançamento: remove parcelas,
 * datas, números e símbolos, sobrando o "nome" para casar histórico/dicas.
 */
export function merchantKey(descricao: string): string {
  let s = normalizeText(descricao);
  s = s.replace(/\d+\s*[\/x]\s*\d+/g, " "); // parcelas 3/10, 3x10
  s = s.replace(/\d{1,2}\/\d{1,2}(\/\d{2,4})?/g, " "); // datas
  s = s.replace(/[*#•]/g, " ");
  s = s.replace(/\d+/g, " "); // números soltos
  s = s.replace(/[^a-z ]/g, " "); // só letras e espaço
  s = s.replace(/\s+/g, " ").trim();
  return s.split(" ").slice(0, 4).join(" ").slice(0, 80);
}

/**
 * Extrai "Parcela X de Y" (ou "Parcela X/Y") da descrição, devolvendo os
 * números e a descrição limpa. Ex.: "MERCADOLIVRE*LENOVO Parcela 4 de 18".
 */
export function extractParcela(descricao: string): {
  parcelaNum?: number;
  parcelaTotal?: number;
  descricao: string;
} {
  const m = descricao.match(/parcela\s+(\d+)\s*(?:de|\/)\s*(\d+)/i);
  if (!m) return { descricao };
  const parcelaNum = Number(m[1]);
  const parcelaTotal = Number(m[2]);
  if (!(parcelaNum >= 1 && parcelaTotal >= 1)) return { descricao };
  const limpa = descricao.replace(m[0], " ").replace(/\s+/g, " ").trim();
  return { parcelaNum, parcelaTotal, descricao: limpa || descricao };
}

/** Detecta linhas que são pagamento/estorno/crédito (não são compras). */
export function pareceCredito(descricao: string): boolean {
  return /pagamento|estorno|cr[eé]dito|devolu|reembolso|anula/i.test(descricao);
}

// Regras semente: palavras-chave → nome de categoria (casado por nome, incluindo
// subcategorias). Miram a taxonomia sugerida; se a categoria não existir, ignora.
const SEED_RULES: { kw: string[]; categoria: string }[] = [
  { kw: ["netflix", "spotify", "hbo", "max ", "disney", "prime video", "youtube premium", "apple.com", "icloud", "melimais"], categoria: "Streaming" },
  { kw: ["ifood", "rappi", "delivery"], categoria: "Delivery" },
  { kw: ["mcdonald", "mc donalds", "burger", "bk ", "pizza", "starbucks", "eskimo", "pipocas", "cafe", "café", "napolitana"], categoria: "Lanches/Café" },
  { kw: ["restaurante", "steak", "grill", "kiosque", "burgue", "garten", "opa bier"], categoria: "Restaurante" },
  { kw: ["hortifruti", "sacolao"], categoria: "Hortifruti" },
  { kw: ["mercado ", "supermercado", "komprao", "giassi", "condor", "kunz", "fort atacadista", "sams", "atacadao", "carrefour", "assai", "pao de acucar"], categoria: "Mercado" },
  { kw: ["uber", "99app", "99 ", "cabify"], categoria: "App/Táxi" },
  { kw: ["posto", "shell", "ipiranga", "petrobras"], categoria: "Combustível" },
  { kw: ["ecopista", "pista ", "viario", "riosp", "pedagio", "estacionamento", "estapar"], categoria: "Pedágio/Estacionamento" },
  { kw: ["farmacia", "drogaria", "drogasil", "raia", "pacheco", "nissei"], categoria: "Farmácia" },
  { kw: ["amazon", "mercadolivre", "mercado livre", "magalu", "magazine", "americanas", "shopee", "aliexpress", "shein"], categoria: "Marketplace" },
  { kw: ["pernambucanas", "riachuelo", "renner", "cea ", "vestuario"], categoria: "Vestuário" },
  { kw: ["petz", "cobasi", "petshop", "pet shop"], categoria: "Pets" },
  { kw: ["ingressos", "oiingressos", "bareeventos", "eventim", "ingresse"], categoria: "Eventos/Ingressos" },
  { kw: ["enel", "light", "cemig", "copel", "celesc"], categoria: "Energia" },
  { kw: ["sabesp", "casan", "aguas"], categoria: "Água" },
  { kw: ["comgas", "gas "], categoria: "Gás" },
  { kw: ["vivo", "claro", "tim ", "oi ", "net ", "internet", "unifique"], categoria: "Internet/TV" },
  { kw: ["academia", "smartfit", "smart fit", "gympass"], categoria: "Academia" },
];

/**
 * Sugere a categoria (id) para uma descrição. Retorna "" se nada casar.
 * `hints` mapeia merchantKey → categoryId (histórico aprendido).
 */
export function suggestCategoryId(
  descricao: string,
  categories: Category[],
  hints: Record<string, string>,
): string {
  const despesa = categories.filter((c) => c.tipo === "despesa" && !c.arquivada);

  // 1) Histórico aprendido.
  const key = merchantKey(descricao);
  const aprendida = hints[key];
  if (aprendida && despesa.some((c) => c.id === aprendida)) return aprendida;

  // 2) Regras por palavra-chave → categoria do usuário pelo nome.
  const d = normalizeText(descricao);
  for (const rule of SEED_RULES) {
    if (rule.kw.some((k) => d.includes(k))) {
      const alvo = normalizeText(rule.categoria);
      const cat = despesa.find((c) => normalizeText(c.nome) === alvo);
      if (cat?.id) return cat.id;
    }
  }
  return "";
}
