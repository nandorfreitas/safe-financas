let _id = 0;

/** Gera um id estável e único por instância — usado para ligar <label> a controles. */
export function uid(prefix = "oren"): string {
  _id += 1;
  return `${prefix}-${_id}`;
}
