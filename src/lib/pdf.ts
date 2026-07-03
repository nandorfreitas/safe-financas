/**
 * Extração de texto de PDF (client-side, via pdf.js). O parsing por banco fica
 * em ./statements. O pdf.js é carregado sob demanda (dynamic import).
 */

/** Extrai o texto do PDF, reconstruindo linhas pela posição vertical. */
export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // Worker empacotado pelo Vite (mesma origem — sem CDN).
  const workerMod = await import("pdfjs-dist/build/pdf.worker.min.mjs?worker");
  pdfjs.GlobalWorkerOptions.workerPort = new workerMod.default();

  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  let out = "";

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const linhas = new Map<number, { x: number; str: string }[]>();
    for (const item of content.items) {
      const it = item as { str?: string; transform?: number[] };
      if (typeof it.str !== "string" || !it.transform) continue;
      const y = Math.round(it.transform[5]);
      const x = it.transform[4];
      const arr = linhas.get(y) ?? [];
      arr.push({ x, str: it.str });
      linhas.set(y, arr);
    }
    const ys = [...linhas.keys()].sort((a, b) => b - a); // topo → base
    for (const y of ys) {
      const parts = (linhas.get(y) ?? []).sort((a, b) => a.x - b.x).map((s) => s.str);
      const linha = parts.join(" ").replace(/\s+/g, " ").trim();
      if (linha) out += linha + "\n";
    }
    out += "\n";
  }
  return out;
}
