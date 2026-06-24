/**
 * Dinheiro é SEMPRE centavos inteiros. Nunca usar float para armazenar/operar.
 * Estas funções existem só para formatar e converter na borda da UI.
 */

/** Converte centavos (int) para string formatada em BRL: 12345 -> "R$ 123,45". */
export function formatBRL(centavos: number): string {
  const valor = centavos / 100;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

/** Versão sem o símbolo "R$": 12345 -> "123,45". */
export function formatCentavos(centavos: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(centavos / 100);
}

/**
 * Converte texto digitado pelo usuário ("123,45", "1.234,56", "1234.5") em
 * centavos inteiros. Retorna null se não for um número válido.
 */
export function parseToCentavos(input: string): number | null {
  const cleaned = input.trim();
  if (!cleaned) return null;

  // Remove separadores de milhar e normaliza a vírgula decimal para ponto.
  let normalized = cleaned.replace(/\s/g, "");
  const hasComma = normalized.includes(",");
  if (hasComma) {
    // Formato pt-BR: ponto é milhar, vírgula é decimal.
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  }

  const value = Number(normalized);
  if (!Number.isFinite(value)) return null;

  return Math.round(value * 100);
}

/** Percentual de `parte` sobre `todo`, ambos em centavos. Retorna 0 se todo=0. */
export function percentOf(parte: number, todo: number): number {
  if (todo === 0) return 0;
  return (parte / todo) * 100;
}
