/** CPF só com números. */
export const cleanCpf = (v: unknown) => String(v ?? "").replace(/\D/g, "").slice(0, 11);

/** 000.000.000-00 */
export const formatCpf = (v: unknown) => {
  const d = cleanCpf(v);
  return d.replace(/^(\d{3})(\d)/, "$1.$2").replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
};

/** Confere os dígitos verificadores (pega CPF digitado errado). */
export function isValidCpf(v: unknown) {
  const d = cleanCpf(v);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const digit = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(d[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return digit(9) === Number(d[9]) && digit(10) === Number(d[10]);
}
