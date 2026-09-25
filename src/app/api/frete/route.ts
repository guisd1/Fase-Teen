import { QuoteError, quoteShipping } from "@/lib/shipping-quote";

export const dynamic = "force-dynamic";

const reply = (status: number, body: unknown) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const items: unknown = body?.items;
  try {
    return reply(200, await quoteShipping(body?.postalCode, Array.isArray(items) ? items : []));
  } catch (error) {
    if (error instanceof QuoteError) return reply(error.status, { error: error.message });
    return reply(502, { error: error instanceof Error ? error.message : "Não foi possível calcular o frete." });
  }
}
