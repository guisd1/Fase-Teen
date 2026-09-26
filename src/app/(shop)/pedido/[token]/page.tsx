import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOrderByToken } from "@/db/orders";
import OrderTracker from "@/components/OrderTracker";

export const dynamic = "force-dynamic";

// Página pessoal do cliente: fica fora do Google.
export const metadata: Metadata = { title: "Seu pedido", robots: { index: false, follow: false } };

/** Acompanhamento do pedido (volta do checkout do cartão e link do Pix). Só com o token secreto. */
export default async function OrderPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const order = await getOrderByToken(token);
  if (!order) notFound();
  return (
    <OrderTracker
      token={token}
      order={{
        code: order.code,
        firstName: order.customerName.split(" ")[0],
        status: order.status,
        paymentMethod: order.paymentMethod,
        paid: Boolean(order.paidAt),
        items: order.items.map(i => ({ name: i.name, size: i.size, color: i.color, qty: i.qty, price: i.price })),
        subtotal: order.subtotal,
        discount: order.discount,
        paymentDiscount: order.paymentDiscount,
        freight: order.freight,
        total: order.total,
        pickup: order.deliveryMode === "pickup",
        trackingCode: order.trackingCode,
        pix: order.paymentMethod === "pix" ? order.paymentData ?? null : null,
        checkoutUrl: order.paymentMethod === "card" ? order.paymentData?.checkoutUrl ?? null : null
      }}
    />
  );
}
