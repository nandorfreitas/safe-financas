/**
 * Leitura de planilha .xlsx (client-side, via SheetJS) para importação de
 * fatura. A biblioteca é carregada sob demanda (dynamic import), como o pdf.js.
 * O parsing (quais colunas são data/valor/etc.) fica em ./statements.
 */

/** Lê a primeira aba como matriz de células (strings). Datas em dd/mm/yyyy. */
export async function extractXlsxRows(file: File): Promise<string[][]> {
  const XLSX = await import("xlsx");
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array", cellDates: true });
  const sheetName = wb.SheetNames[0];
  const sheet = sheetName ? wb.Sheets[sheetName] : undefined;
  if (!sheet) return [];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: false, // valores formatados como texto (moeda/data como exibidos)
    dateNF: "dd/mm/yyyy", // evita ambiguidade de locale nas datas
    defval: "",
    blankrows: false,
  });
  return rows.map((r) => r.map((c) => (c == null ? "" : String(c).trim())));
}
