export const money = (v: number | null | undefined) =>
  Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const cleanCep = (v: unknown) => String(v ?? "").replace(/\D/g, "").slice(0, 8);

export const formatCep = (v: unknown) => {
  const c = cleanCep(v);
  return c.length > 5 ? `${c.slice(0, 5)}-${c.slice(5)}` : c;
};
