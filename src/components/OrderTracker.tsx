"use client";

import { useEffect } from "react";
import Link from "next/link";
import { money } from "@/lib/format";
import { trackingUrl } from "@/lib/order-messages";
import { hasWhatsapp, whatsappUrl } from "@/lib/whatsapp";
import PixPayment, { useOrderStatus, type PixData } from "./PixPayment";
import { useShop } from "./ShopShell";

export interface TrackedOrder {
  code: string;
  firstName: string;
  status: string;
  paymentMethod: string;
  paid: boolean;
  items: { name: string; size: string; color: string; qty: number; price: number }[];
  subtotal: number;
  discount: number;
  paymentDiscount: number;
  freight: number;
  total: number;
  pickup: boolean;
  trackingCode: string | null;
  pix: PixData | null;
  checkoutUrl: string | null;
}

/** Linha do tempo do pedido, na linguagem da cliente. */
function StatusSteps({ status, pickup }: { status: string; pickup: boolean }) {
  const steps = [
    { key: "pendente", label: "Pedido recebido" },
    { key: "preparacao", label: "Em preparação" },
    { key: "enviado", label: pickup ? "Pronto para retirada" : "Enviado" },
    { key: "entregue", label: pickup ? "Retirado" : "Entregue" }
  ];
  const current = steps.findIndex(s => s.key === status);
  return (
    <ol className="order-steps">
      {steps.map((s, i) => (
        <li key={s.key} className={i < current ? "done" : i === current ? "current" : ""}>{s.label}</li>
      ))}
    </ol>
  );
}

export default function OrderTracker({ token, order }: { token: string; order: TrackedOrder }) {
  const { store, cart } = useShop();
  const online = order.paymentMethod !== "whatsapp";
  const live = useOrderStatus(token, online && !order.paid);
  const paid = order.paid || Boolean(live?.paid);
  const status = live?.status ?? order.status;
  const rejected = !paid && order.paymentMethod === "card" && (live?.paymentStatus === "rejected" || live?.paymentStatus === "cancelled");

  // Pagou: o carrinho deste pedido já pode ser esvaziado.
  useEffect(() => {
    if (paid) cart.clearCart();
  }, [paid]); // eslint-disable-line react-hooks/exhaustive-deps

  const talk = whatsappUrl(store, `Olá! Fiz o pedido nº ${order.code} no site${paid ? " e o pagamento já foi aprovado" : ""}.`);

  return (
    <main className="product-page order-page">
      <div className="order-card">
        <p className="eyebrow">PEDIDO Nº {order.code}</p>
        {status === "cancelado" ? (
          <>
            <h1>Pedido cancelado</h1>
            <p className="order-lead">Este pedido foi cancelado. Se tiver alguma dúvida, fale com a gente pelo WhatsApp.</p>
          </>
        ) : status === "entregue" ? (
          <>
            <h1>{order.pickup ? "Pedido retirado!" : "Pedido entregue!"}</h1>
            <p className="order-lead">Obrigado por comprar com a {store.name}, {order.firstName}! Esperamos que você ame as peças. Se puder, conta pra gente o que achou avaliando o produto no site.</p>
          </>
        ) : status === "enviado" ? (
          <>
            <h1>{order.pickup ? "Pronto para retirada!" : "Pedido enviado!"}</h1>
            <p className="order-lead">
              {order.pickup
                ? `${order.firstName}, seu pedido já está separado esperando por você na loja.`
                : `${order.firstName}, seu pedido já está a caminho.`}
            </p>
            {!order.pickup && order.trackingCode && (
              <p className="order-tracking">
                Código de rastreio: <strong>{order.trackingCode}</strong>{" "}
                <a href={trackingUrl(order.trackingCode)} target="_blank" rel="noopener">Acompanhar entrega</a>
              </p>
            )}
          </>
        ) : status === "preparacao" ? (
          <>
            <h1>{paid ? "Pagamento aprovado!" : "Pedido confirmado!"}</h1>
            <p className="order-lead">Obrigado, {order.firstName}! Seu pedido está {order.pickup ? "sendo separado para retirada" : "em preparação para envio"}. A gente te avisa pelo WhatsApp a cada etapa.</p>
          </>
        ) : paid ? (
          <>
            <h1>Pagamento aprovado!</h1>
            <p className="order-lead">Obrigado, {order.firstName}! Seu pedido já está {order.pickup ? "sendo separado para retirada" : "em preparação para envio"}. A gente te avisa pelo WhatsApp a cada etapa.</p>
          </>
        ) : order.paymentMethod === "pix" ? (
          <>
            <h1>Falta só pagar o Pix</h1>
            <p className="order-lead">Assim que o pagamento cair, esta página se atualiza sozinha.</p>
            {order.pix && <PixPayment pix={order.pix} total={order.total} />}
          </>
        ) : order.paymentMethod === "card" ? (
          <>
            <h1>{rejected ? "Pagamento não aprovado" : "Confirmando o pagamento..."}</h1>
            <p className="order-lead">
              {rejected
                ? "O cartão foi recusado. Você pode tentar de novo com outro cartão ou falar com a gente."
                : "Se você já pagou, a confirmação aparece aqui em instantes. Se não concluiu, é só voltar ao pagamento."}
            </p>
            {order.checkoutUrl && <a className="btn btn-dark full" href={order.checkoutUrl}>{rejected ? "Tentar outro cartão" : "Voltar ao pagamento"}</a>}
          </>
        ) : (
          <>
            <h1>Pedido registrado</h1>
            <p className="order-lead">Recebemos seu pedido. O pagamento e a entrega são combinados pelo WhatsApp.</p>
          </>
        )}

        {status !== "cancelado" && <StatusSteps status={status} pickup={order.pickup} />}

        <div className="order-summary">
          {order.items.map((i, idx) => (
            <div key={idx} className="order-line">
              <span>{i.qty}× {i.name}<small>{[i.size && `Tam. ${i.size}`, i.color].filter(Boolean).join(" • ")}</small></span>
              <strong>{money(i.price * i.qty)}</strong>
            </div>
          ))}
          <div className="order-line"><span>Subtotal</span><span>{money(order.subtotal)}</span></div>
          {order.discount > 0 && <div className="order-line"><span>Cupom</span><span>− {money(order.discount)}</span></div>}
          {order.paymentDiscount > 0 && <div className="order-line"><span>Desconto do Pix</span><span>− {money(order.paymentDiscount)}</span></div>}
          <div className="order-line"><span>{order.pickup ? "Retirada na loja" : "Frete"}</span><span>{money(order.freight)}</span></div>
          <div className="order-line order-total"><span>Total</span><strong>{money(order.total)}</strong></div>
        </div>

        <div className="order-actions">
          {hasWhatsapp(store) && <a className="btn btn-light full" href={talk} target="_blank" rel="noopener">Falar com a loja no WhatsApp</a>}
          <Link className="btn btn-light full" href="/">Voltar para a loja</Link>
        </div>
      </div>
    </main>
  );
}
