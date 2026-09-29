import { QuoteError, quoteShipping } from "@/lib/shipping-quote";
import { rateLimited } from "@/lib/redis";

export const dynamic = "force-dynamic";

const reply = (status: number, body: unknown) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  // Cada cálculo consulta o Melhor Envio: limite por internet para ninguém gastar a cota da loja.
  if (await rateLimited(request, "frete", 60, 10 * 60)) {
    return reply(429, { error: "Muitos cálculos de frete em pouco tempo. Aguarde alguns minutos." });
  }
  const body = await request.json().catch(() => ({}));
  const items: unknown = body?.items;
  try {
    const quote = await quoteShipping(body?.postalCode, Array.isArray(items) ? items : []);
    // O cliente vê só o frete com a taxa; o valor da transportadora fica no servidor.
    return reply(200, { ...quote, options: quote.options.map(({ cost: _cost, ...o }) => o) });
  } catch (error) {
    if (error instanceof QuoteError) return reply(error.status, { error: error.message });
    return reply(502, { error: error instanceof Error ? error.message : "Não foi possível calcular o frete." });
  }
}
