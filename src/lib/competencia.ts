/** Utilidades de competência mensal ("YYYY-MM"). */
import { Timestamp } from "firebase/firestore";
import type { Competencia } from "@/types/models";

/** Competência da data informada (ou de hoje). Ex.: "2026-06". */
export function competenciaDe(date = new Date()): Competencia {
  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  return `${ano}-${mes}`;
}

/** Quebra "2026-06" em { ano: 2026, mes: 6 }. */
export function parseCompetencia(c: Competencia): { ano: number; mes: number } {
  const [ano, mes] = c.split("-").map(Number);
  return { ano, mes };
}

/** Avança/retrocede N meses a partir de uma competência. */
export function addMeses(c: Competencia, n: number): Competencia {
  const { ano, mes } = parseCompetencia(c);
  const d = new Date(ano, mes - 1 + n, 1);
  return competenciaDe(d);
}

/** Rótulo amigável: "2026-06" -> "junho de 2026". */
export function competenciaLabel(c: Competencia): string {
  const { ano, mes } = parseCompetencia(c);
  const d = new Date(ano, mes - 1, 1);
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

/** Início/fim (Timestamp) da competência, para filtrar transações por `data`. */
export function intervaloCompetencia(c: Competencia): { inicio: Timestamp; fim: Timestamp } {
  const { ano, mes } = parseCompetencia(c);
  const inicio = new Date(ano, mes - 1, 1, 0, 0, 0, 0);
  const fim = new Date(ano, mes, 1, 0, 0, 0, 0); // primeiro instante do mês seguinte
  return { inicio: Timestamp.fromDate(inicio), fim: Timestamp.fromDate(fim) };
}

/** Data de vencimento a partir do dia e da competência (Timestamp). */
export function vencimentoDe(diaVencimento: number, c: Competencia): Timestamp {
  const { ano, mes } = parseCompetencia(c);
  // Limita o dia ao último dia do mês (ex.: dia 31 em fevereiro).
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const dia = Math.min(diaVencimento, ultimoDia);
  return Timestamp.fromDate(new Date(ano, mes - 1, dia));
}
