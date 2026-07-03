/**
 * Parser de CSV client-side (sem dependências) e helpers de valor/data no
 * formato brasileiro. Suporta delimitador `,`, `;` ou tab (auto-detectado) e
 * campos entre aspas com aspas escapadas ("").
 */

export interface ParsedCsv {
  headers: string[];
  rows: string[][];
  delimiter: string;
}

function detectDelimiter(text: string): string {
  const nl = text.indexOf("\n");
  const first = nl >= 0 ? text.slice(0, nl) : text;
  const count = (re: RegExp) => (first.match(re) ?? []).length;
  const semi = count(/;/g);
  const comma = count(/,/g);
  const tab = count(/\t/g);
  if (tab >= semi && tab >= comma) return "\t";
  return semi > comma ? ";" : ",";
}

export function parseCsv(input: string): ParsedCsv {
  const text = input.replace(/^﻿/, ""); // remove BOM
  const delimiter = detectDelimiter(text);
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const nonEmpty = rows.filter((r) => r.some((c) => c.trim() !== ""));
  const headers = (nonEmpty.shift() ?? []).map((h) => h.trim());
  return { headers, rows: nonEmpty, delimiter };
}

/** Converte "1.234,56" / "1234,56" / "1234.56" / "-R$ 10,00" em centavos (com sinal). */
export function parseValorBR(raw: string): number | null {
  let s = raw.trim().replace(/r\$/i, "").replace(/\s/g, "");
  if (!s) return null;
  const negativo = /^-/.test(s) || /-$/.test(s) || /^\(.*\)$/.test(s);
  s = s.replace(/[()]/g, "").replace(/^-|-$/g, "");
  if (!s) return null;

  if (s.includes(",") && s.includes(".")) {
    // 1.234,56 → ponto milhar, vírgula decimal
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (s.includes(",")) {
    s = s.replace(",", ".");
  } else if (s.includes(".")) {
    const parts = s.split(".");
    // vários pontos, ou grupo final de 3 dígitos → separador de milhar
    if (parts.length > 2 || (parts[1] && parts[1].length === 3)) {
      s = parts.join("");
    }
  }
  const v = Number(s);
  if (!Number.isFinite(v)) return null;
  const cents = Math.round(v * 100);
  return negativo ? -cents : cents;
}

/** Converte "dd/mm/aaaa", "dd/mm/aa" ou "aaaa-mm-dd" em Date (meio-dia local). */
export function parseDataBR(raw: string): Date | null {
  const s = raw.trim();
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    const dia = Number(m[1]);
    const mes = Number(m[2]);
    const ano = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
    return new Date(ano, mes - 1, dia, 12, 0, 0);
  }
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0);
  return null;
}
