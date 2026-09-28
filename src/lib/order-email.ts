/*
  Aviso de venda por e-mail para a loja, pela Brevo (a mesma conta da newsletter).
    - Pedido pelo WhatsApp: avisa quando o pedido é registrado.
    - Pix ou cartão: avisa quando o pagamento é aprovado.
  O remetente precisa estar verificado na Brevo (Remetentes & IP → Remetentes).
  Um erro no e-mail nunca atrapalha o pedido: fica registrado para o painel mostrar.
*/
import type { OrderRow } from "@/db/schema";
import { getOrderEmailSettings, saveOrderEmailError } from "@/db/settings";
import { getStore } from "@/stores";
import { money, withRef } from "./format";
import { METHOD_LABELS } from "./payment-labels";

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

async function sendBrevo(to: string, from: string, subject: string, html: string) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error("BREVO_API_KEY não configurada na Vercel.");
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": apiKey, "Accept": "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: { name: getStore().name, email: from },
      to: [{ email: to }],
      subject,
      htmlContent: html
    })
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.message || `A Brevo recusou o e-mail (${response.status}).`);
  }
}

function orderHtml(order: OrderRow, headline: string) {
  const store = getStore();
  const s = order.shipping;
  const a = order.address;
  const items = order.items.map(i =>
    `<tr><td style="padding:6px 0">${i.qty}× ${esc(withRef(i.name, i.reference))}<br><small style="color:#777">${esc([i.size && `Tam. ${i.size}`, i.color].filter(Boolean).join(" • "))}</small></td>` +
    `<td style="padding:6px 0;text-align:right;white-space:nowrap">${money(i.price * i.qty)}</td></tr>`
  ).join("");
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#2e1b35">
    <h2 style="margin:0 0 4px">${esc(headline)}</h2>
    <p style="margin:0 0 16px;color:#666">Pedido nº <strong>${esc(order.code)}</strong> • ${esc(store.name)}</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">${items}
      <tr><td style="padding-top:10px;border-top:1px solid #eee">Frete</td><td style="padding-top:10px;border-top:1px solid #eee;text-align:right">${order.freight === 0 && order.deliveryMode !== "pickup" ? "Grátis" : money(order.freight)}</td></tr>
      ${order.discount > 0 ? `<tr><td>Cupom ${esc(order.couponCode)}</td><td style="text-align:right">− ${money(order.discount)}</td></tr>` : ""}
      <tr><td style="padding-top:6px"><strong>Total</strong></td><td style="padding-top:6px;text-align:right"><strong>${money(order.total)}</strong></td></tr>
    </table>
    <p style="font-size:14px;margin:16px 0 4px"><strong>Cliente:</strong> ${esc(order.customerName)} • ${esc(order.customerPhone)}${order.customerEmail ? ` • ${esc(order.customerEmail)}` : ""}</p>
    <p style="font-size:14px;margin:4px 0"><strong>Pagamento:</strong> ${esc(METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod)}${order.paidAt ? " (pago)" : ""}</p>
    <p style="font-size:14px;margin:4px 0"><strong>Entrega:</strong> ${order.deliveryMode === "pickup" ? "Retirada na loja" : `${esc([s?.company, s?.service].filter(Boolean).join(" "))}${a ? ` — ${esc(a.city)}/${esc(a.state)}` : ""}`}</p>
    ${order.notes ? `<p style="font-size:14px;margin:4px 0"><strong>Observações:</strong> ${esc(order.notes)}</p>` : ""}
    <p style="margin:20px 0"><a href="${store.siteUrl}/admin/pedidos/${order.id}" style="background:#2e1b35;color:#fff;padding:12px 18px;border-radius:99px;text-decoration:none;font-weight:bold">Abrir pedido no painel</a></p>
  </div>`;
}

/** Envia o aviso de venda (se estiver ligado no painel). Nunca lança erro. */
export async function notifySale(order: OrderRow, reason: "whatsapp" | "paid") {
  try {
    const cfg = await getOrderEmailSettings();
    if (!cfg?.to) return;
    const headline = reason === "paid" ? `Venda paga: ${money(order.total)}` : `Pedido novo pelo WhatsApp: ${money(order.total)}`;
    await sendBrevo(cfg.to, cfg.from || cfg.to, `${headline} • pedido nº ${order.code}`, orderHtml(order, headline));
  } catch (error) {
    console.error("Aviso de venda por e-mail:", error);
    await saveOrderEmailError(error instanceof Error ? error.message : String(error)).catch(() => {});
  }
}

/** E-mail de teste (botão em Integrações). */
export async function sendTestEmail(to: string, from: string) {
  await sendBrevo(to, from || to, `Teste: aviso de venda da ${getStore().name}`,
    `<div style="font-family:Arial,sans-serif"><h2>Tudo certo!</h2><p>Os avisos de venda da ${esc(getStore().name)} vão chegar neste e-mail.</p></div>`);
}
