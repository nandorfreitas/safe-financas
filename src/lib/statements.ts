/**
 * Parsers de fatura por banco/emissor. Cada calibração fica ISOLADA aqui —
 * adicionar um novo banco é criar uma função e registrá-la em STATEMENT_PARSERS,
 * sem afetar as demais. `extractPdfText` (em ./pdf) entrega o texto; cada parser
 * decide como transformar em lançamentos.
 */
import { parseValorBR } from "./csv";
import { pareceCredito, extractParcela } from "./categorize";

export interface StatementRow {
  data: Date | null;
  descricao: string;
  /** Centavos, positivo. */
  valor: number;
  /** Pagamento/estorno/crédito — não é compra. */
  credito: boolean;
  parcelaNum?: number;
  parcelaTotal?: number;
}

export interface StatementParser {
  id: string;
  label: string;
  parse(text: string, anoFallback: number): StatementRow[];
}

const RE_VALOR = /R?\$?\s?\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2}/g;

function anoDe(m: RegExpMatchArray, idx: number, fallback: number): number {
  const y = m[idx];
  if (!y) return fallback;
  return y.length === 2 ? 2000 + Number(y) : Number(y);
}

/** Monta um StatementRow a partir da data, do texto "resto" e do valor bruto. */
function montar(
  data: Date | null,
  resto: string,
  valRaw: string,
): StatementRow | null {
  const valor = parseValorBR(valRaw);
  if (valor == null || valor === 0) return null;
  const bruto = resto.replace(/R\$/g, " ").replace(/\s+/g, " ").trim();
  if (!bruto) return null;
  const { parcelaNum, parcelaTotal, descricao } = extractParcela(bruto);
  return {
    data,
    descricao,
    valor: Math.abs(valor),
    credito: pareceCredito(descricao),
    parcelaNum,
    parcelaTotal,
  };
}

// ── Mercado Pago (calibrado) ──────────────────────────────────────────────
// As linhas de compra COMEÇAM com a data DD/MM. Isso descarta naturalmente
// cabeçalhos, resumos e "Total R$…". Valores são positivos; pagamento/crédito
// vem só por palavra-chave. Datas sem ano usam o ano da competência.
const RE_DATA_INICIO = /^(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?\b/;

function parseMercadoPago(text: string, anoFallback: number): StatementRow[] {
  const out: StatementRow[] = [];
  for (const raw of text.split("\n")) {
    const linha = raw.trim();
    const dm = linha.match(RE_DATA_INICIO);
    if (!dm) continue;
    const valores = [...linha.matchAll(RE_VALOR)];
    if (valores.length === 0) continue;
    const valRaw = valores[valores.length - 1][0];
    const dia = Number(dm[1]);
    const mes = Number(dm[2]);
    if (dia < 1 || dia > 31 || mes < 1 || mes > 12) continue;
    const data = new Date(anoDe(dm, 3, anoFallback), mes - 1, dia, 12, 0, 0);
    const resto = linha.replace(dm[0], " ").replace(valRaw, " ");
    const row = montar(data, resto, valRaw);
    if (row) out.push(row);
  }
  return out;
}

// ── Genérico (best-effort) ────────────────────────────────────────────────
// Procura uma data em qualquer posição e o último valor da linha. Mais ruído —
// use como tentativa para bancos ainda não calibrados (revise bem a prévia).
const RE_DATA_QUALQUER = /\b(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?\b/;

function parseGenerico(text: string, anoFallback: number): StatementRow[] {
  const out: StatementRow[] = [];
  for (const raw of text.split("\n")) {
    const linha = raw.trim();
    if (!linha) continue;
    const valores = [...linha.matchAll(RE_VALOR)];
    if (valores.length === 0) continue;
    const valRaw = valores[valores.length - 1][0];
    let data: Date | null = null;
    const dm = linha.match(RE_DATA_QUALQUER);
    if (dm) {
      const dia = Number(dm[1]);
      const mes = Number(dm[2]);
      if (dia >= 1 && dia <= 31 && mes >= 1 && mes <= 12) {
        data = new Date(anoDe(dm, 3, anoFallback), mes - 1, dia, 12, 0, 0);
      }
    }
    const resto = (dm ? linha.replace(dm[0], " ") : linha).replace(valRaw, " ");
    const row = montar(data, resto, valRaw);
    if (row) out.push(row);
  }
  return out;
}

export const STATEMENT_PARSERS: StatementParser[] = [
  { id: "mercadopago", label: "Mercado Pago", parse: parseMercadoPago },
  { id: "generico", label: "Genérico (tentar)", parse: parseGenerico },
];

export function getStatementParser(id: string): StatementParser {
  return STATEMENT_PARSERS.find((p) => p.id === id) ?? STATEMENT_PARSERS[0];
}
