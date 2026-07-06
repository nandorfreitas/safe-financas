/**
 * Parsers de fatura por banco/emissor. Cada calibração fica ISOLADA aqui —
 * adicionar um novo banco é criar uma função e registrá-la em STATEMENT_PARSERS,
 * sem afetar as demais. `extractPdfText` (em ./pdf) entrega o texto; cada parser
 * decide como transformar em lançamentos.
 */
import { parseValorBR, parseDataBR } from "./csv";
import { pareceCredito, extractParcela, normalizeText } from "./categorize";

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

// ── Itaú (calibrado) ──────────────────────────────────────────────────────
// Fatura Itaú (PDF): as compras ficam na seção "Lançamentos: compras e saques"
// e terminam no total "Lançamentos no cartão". Cada compra é:
//   DD/MM (data da COMPRA) + estabelecimento + [parcela NN/MM] + valor
// A 2ª linha de cada item (categoria + cidade do próprio Itaú) não tem valor e
// é naturalmente ignorada. Ficam DE FORA (crédito ou faturas futuras):
//   "Pagamentos efetuados", "produtos e serviços" (cashback) e sobretudo
//   "Compras parceladas - próximas faturas" — senão as parcelas futuras duplicam.
// Parcela no Itaú vem como "NN/MM" (4/8) logo antes do valor, não "parcela X de Y".
const RE_PARCELA_ITAU = /\b(\d{1,2})\/(\d{1,2})\s*$/;

/**
 * Remove as parcelas repetidas da seção "Compras parceladas - próximas faturas":
 * o MESMO parcelamento (estabelecimento + valor + total) aparece com a parcela
 * desta fatura (ex.: 4/8) e a da próxima (5/8). Mantém a de MENOR número — a
 * vigente. Feito por CONTEÚDO, não por posição, porque a extração do PDF em 2
 * colunas embaralha a ordem das seções.
 */
function dedupParcelasFuturas(rows: StatementRow[]): StatementRow[] {
  const idxPorPlano = new Map<string, number>();
  const out: StatementRow[] = [];
  for (const r of rows) {
    if (r.parcelaTotal && r.parcelaTotal > 1 && r.parcelaNum != null) {
      const key = `${normalizeText(r.descricao)}|${r.valor}|${r.parcelaTotal}`;
      const idx = idxPorPlano.get(key);
      if (idx != null) {
        if ((r.parcelaNum ?? 0) < (out[idx].parcelaNum ?? 0)) out[idx] = r;
        continue;
      }
      idxPorPlano.set(key, out.length);
    }
    out.push(r);
  }
  return out;
}

function parseItau(text: string, anoFallback: number): StatementRow[] {
  const bruto: StatementRow[] = [];
  let capturando = false;
  for (const raw of text.split("\n")) {
    const linha = raw.trim();
    if (!linha) continue;

    // Janela da seção de compras. Só o início e o total final delimitam — NÃO
    // usamos "Compras parceladas"/"Total dos lançamentos" como fronteira: no PDF
    // de 2 colunas essas linhas vêm intercaladas logo no início da seção e
    // cortariam a captura. As parcelas futuras são removidas depois (dedup).
    if (/lan[çc]amentos:?\s*compras\s+e\s+saques/i.test(linha)) {
      capturando = true;
      continue;
    }
    if (/lan[çc]amentos\s+no\s+cart[ãa]o/i.test(linha)) {
      capturando = false;
      continue;
    }
    if (!capturando) continue;

    // Linha de compra: começa com a data DD/MM.
    const dm = linha.match(RE_DATA_INICIO);
    if (!dm) continue;
    const dia = Number(dm[1]);
    const mes = Number(dm[2]);
    if (dia < 1 || dia > 31 || mes < 1 || mes > 12) continue;
    const valores = [...linha.matchAll(RE_VALOR)];
    if (valores.length === 0) continue;
    const vm = valores[valores.length - 1];
    const valRaw = vm[0];
    // "-" imediatamente antes do valor => crédito/estorno (cashback, devolução).
    const negativo = linha.slice(0, vm.index).trimEnd().endsWith("-");
    const data = new Date(anoDe(dm, 3, anoFallback), mes - 1, dia, 12, 0, 0);

    // Tira a data e o valor; o que sobra é "estabelecimento [+ parcela NN/MM]".
    let resto = linha
      .replace(dm[0], " ")
      .replace(valRaw, " ")
      .replace(/-\s*$/, " ")
      .replace(/\s+/g, " ")
      .trim();
    let parcelaNum: number | undefined;
    let parcelaTotal: number | undefined;
    const pm = resto.match(RE_PARCELA_ITAU);
    if (pm && pm.index != null) {
      const n = Number(pm[1]);
      const t = Number(pm[2]);
      // Só trata como parcela se for um parcelamento real (total > 1).
      if (n >= 1 && t > 1 && n <= t && t <= 99) {
        parcelaNum = n;
        parcelaTotal = t;
        resto = resto.slice(0, pm.index).trim();
      }
    }

    const valor = parseValorBR(valRaw);
    if (valor == null || valor === 0) continue;
    const descricao = resto.replace(/R\$/g, " ").replace(/\s+/g, " ").trim();
    if (!descricao) continue;
    bruto.push({
      data,
      descricao,
      valor: Math.abs(valor),
      credito: negativo || pareceCredito(descricao) || /cashback/i.test(descricao),
      parcelaNum,
      parcelaTotal,
    });
  }
  return dedupParcelasFuturas(bruto);
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

// ── Planilha (.xlsx) — ex.: export do Itaú ────────────────────────────────
// Formato tabular e limpo: localiza a linha de cabeçalho por nome (Data,
// Lançamento/Descrição, Valor, Parcelamento) e lê as linhas seguintes. Bem mais
// robusto que o PDF (sem colunas grudando nem seção de "próximas faturas").
// Créditos/estornos vêm com valor NEGATIVO (Pagamento, Cashback) — marcados.
const RE_DECIMAL = /[.,]\d{2}(?!\d)/; // "20,00" / "1.744,63" / "1744.63"

export function parseXlsxStatement(rows: string[][]): StatementRow[] {
  const norm = (s: string) => normalizeText(s ?? "");

  // Acha o cabeçalho dos lançamentos: linha com Data + Valor + Descrição. Exigir
  // a coluna de descrição evita casar com o resumo "Cartão | Valor | Vencimento".
  let head = -1;
  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i].map(norm);
    const temData = cells.some((c) => /^data\b|vencimento/.test(c));
    const temValor = cells.some((c) => /valor/.test(c));
    const temDesc = cells.some((c) => /lan[çc]|descri|estabele|hist/.test(c));
    if (temData && temValor && temDesc) {
      head = i;
      break;
    }
  }
  if (head < 0) return [];

  const header = rows[head].map(norm);
  const colBy = (re: RegExp) => header.findIndex((c) => re.test(c));
  const colData = colBy(/^data\b|vencimento/);
  const colDesc = colBy(/lan[çc]|descri|estabele|hist/);
  const colParc = colBy(/parcel/);
  const colValor = colBy(/valor/);
  if (colData < 0) return [];

  const out: StatementRow[] = [];
  for (let i = head + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const data = parseDataBR(row[colData] ?? "");
    if (!data) continue; // linhas sem data válida = metadados/totais → ignora

    // Valor: da coluna Valor em diante, a primeira célula que pareça monetária
    // (evita pegar "R$" isolado, nº do cartão "****3921" etc.).
    let valor: number | null = null;
    for (let j = Math.max(0, colValor); j < row.length; j++) {
      const cell = row[j] ?? "";
      if (RE_DECIMAL.test(cell)) {
        const v = parseValorBR(cell);
        if (v != null) {
          valor = v;
          break;
        }
      }
    }
    if (valor == null || valor === 0) continue;

    const descricao = (colDesc >= 0 ? row[colDesc] ?? "" : "").trim();
    if (!descricao) continue;

    let parcelaNum: number | undefined;
    let parcelaTotal: number | undefined;
    const pm = (colParc >= 0 ? row[colParc] ?? "" : "").match(/(\d+)\s*(?:de|\/)\s*(\d+)/i);
    if (pm) {
      const n = Number(pm[1]);
      const t = Number(pm[2]);
      if (n >= 1 && t > 1 && n <= t && t <= 99) {
        parcelaNum = n;
        parcelaTotal = t;
      }
    }

    out.push({
      data,
      descricao,
      valor: Math.abs(valor),
      credito: valor < 0 || pareceCredito(descricao),
      parcelaNum,
      parcelaTotal,
    });
  }
  return out;
}

export const STATEMENT_PARSERS: StatementParser[] = [
  { id: "mercadopago", label: "Mercado Pago", parse: parseMercadoPago },
  { id: "itau", label: "Itaú", parse: parseItau },
  { id: "generico", label: "Genérico (tentar)", parse: parseGenerico },
];

export function getStatementParser(id: string): StatementParser {
  return STATEMENT_PARSERS.find((p) => p.id === id) ?? STATEMENT_PARSERS[0];
}
