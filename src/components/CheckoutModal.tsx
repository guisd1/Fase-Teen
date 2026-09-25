"use client";

import { useState, type FormEvent } from "react";
import type { StoreConfig } from "@/stores/types";
import { cleanCep, formatCep, money } from "@/lib/format";
import { hasWhatsapp, whatsappUrl } from "@/lib/whatsapp";
import type { Address, Cart } from "./useCart";
import PixPayment, { useOrderStatus, type PixData } from "./PixPayment";

interface FormData {
  name: string;
  phone: string;
  email: string;
  cep: string;
  address: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  notes: string;
}

function initialForm(cart: Cart): FormData {
  const a = cart.deliveryMode === "delivery" ? cart.address : null;
  return {
    name: "", phone: "", email: "",
    cep: cart.cep ? formatCep(cart.cep) : "",
    address: a?.address || "", number: "", complement: a?.complement || "",
    district: a?.district || "", city: a?.city || "", state: a?.state || "",
    notes: ""
  };
}

/** Pedido gravado no painel, com o desconto confirmado pelo servidor. */
interface Registered {
  /** Número do pedido que o cliente vê. */
  code: string;
  discount: number;
  couponCode: string | null;
  couponError: string | null;
}

const orderBody = (cart: Cart, data: FormData, paymentMethod: PaymentChoice) => JSON.stringify({
  paymentMethod,
  customer: { name: data.name, phone: data.phone, email: data.email },
  items: cart.items.map(x => ({ id: x.id, size: x.size, color: x.color, qty: x.qty })),
  deliveryMode: cart.deliveryMode,
  address: { ...data, cep: cleanCep(data.cep) },
  shipping: cart.selectedShipping,
  couponCode: cart.discount > 0 ? cart.coupon?.code : undefined,
  notes: data.notes
});

type PaymentChoice = "pix" | "card" | "whatsapp";

/** Pedido pago online, já criado no Mercado Pago. */
interface OnlineOrder {
  code: string;
  token: string;
  total: number;
  pix?: PixData;
  checkoutUrl?: string;
}

/** Cria o pedido e a cobrança (Pix ou cartão). Em caso de erro, devolve a mensagem. */
async function startOnlinePayment(cart: Cart, data: FormData, method: "pix" | "card"): Promise<OnlineOrder | { error: string; shippingChanged?: boolean }> {
  try {
    const r = await fetch("/api/pedidos", { method: "POST", headers: { "Content-Type": "application/json" }, body: orderBody(cart, data, method) });
    const json = await r.json().catch(() => ({}));
    if (!r.ok || typeof json.token !== "string") return { error: json.error || "Não foi possível iniciar o pagamento.", shippingChanged: json.shippingChanged };
    return { code: json.code, token: json.token, total: Number(json.total), pix: json.pix, checkoutUrl: json.checkoutUrl };
  } catch {
    return { error: "Sem conexão. Confira a internet e tente de novo." };
  }
}

/** Registra o pedido no painel. Devolve null se não deu para gravar. */
async function registerOrder(cart: Cart, data: FormData): Promise<Registered | null> {
  try {
    const r = await fetch("/api/pedidos", { method: "POST", headers: { "Content-Type": "application/json" }, body: orderBody(cart, data, "whatsapp") });
    const json = await r.json().catch(() => ({}));
    if (!r.ok || typeof json.code !== "string") return null;
    return { code: json.code, discount: Number(json.discount) || 0, couponCode: json.couponCode ?? null, couponError: json.couponError ?? null };
  } catch {
    return null;
  }
}

function orderMessage(store: StoreConfig, cart: Cart, data: FormData, order: Registered | null) {
  const s = cart.selectedShipping;
  const delivery = cart.deliveryMode === "pickup" || !s
    ? "Retirada na loja física — frete R$ 0,00"
    : `${s.company}${s.service ? ` • ${s.service}` : ""} — ${money(s.price)}${s.deliveryTime ? ` — prazo estimado: ${s.deliveryTime} dias úteis` : ""}`;
  const addressLines = cart.deliveryMode === "pickup" ? [] : [
    `*Endereço:* ${data.address}, ${data.number}`,
    `*Complemento:* ${data.complement || "Não informado"}`,
    `*Bairro:* ${data.district}`,
    `*Cidade:* ${data.city}`,
    `*Estado:* ${data.state.toUpperCase()}`,
    `*CEP:* ${formatCep(data.cep)}`
  ];
  // Com o pedido gravado, vale o desconto conferido pelo servidor; sem ele, o do carrinho.
  const discount = order ? order.discount : cart.discount;
  const couponCode = order ? order.couponCode : cart.coupon?.code;
  const total = cart.subtotal - discount + (cart.freight ?? 0);
  return [
    `Olá! Quero fazer um pedido na *${store.name}*.`,
    ...(order ? [`*Pedido nº ${order.code}*`] : []), "",
    "*Produtos:*", ...cart.items.map(x => `• ${x.product.name} | Tam. ${x.size} | Cor: ${x.color} | Qtd: ${x.qty} | ${money(x.product.price * x.qty)}`), "",
    `*Subtotal:* ${money(cart.subtotal)}`,
    ...(discount > 0 ? [`*Cupom ${couponCode}:* − ${money(discount)}`] : []),
    `*Entrega:* ${delivery}`, `*TOTAL:* ${money(total)}`, "",
    `*Nome:* ${data.name}`, `*WhatsApp:* ${data.phone}`, `*E-mail:* ${data.email}`,
    ...addressLines,
    `*Observações:* ${data.notes || "Não informado"}`, "", "Aguardo confirmação de estoque, pagamento e envio."
  ].join("\n");
}


export default function CheckoutModal({ store, cart, onlinePayments, onClose, onBackToCart }: {
  store: StoreConfig;
  cart: Cart;
  /** Mercado Pago configurado: oferece Pix e cartão. */
  onlinePayments: boolean;
  onClose: () => void;
  onBackToCart: () => void;
}) {
  const [form, setForm] = useState<FormData>(() => initialForm(cart));
  const [addressNote, setAddressNote] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [method, setMethod] = useState<PaymentChoice>(onlinePayments ? "pix" : "whatsapp");
  const [pixOrder, setPixOrder] = useState<OnlineOrder | null>(null);
  const pixStatus = useOrderStatus(pixOrder?.token ?? "", Boolean(pixOrder), () => cart.clearCart());
  const pixPercent = store.commerce.pixDiscountPercent;
  const pixDiscount = Math.round((cart.subtotal - cart.discount) * pixPercent) / 100;
  const [registered, setRegistered] = useState<{ key: string; order: Registered | null; url: string } | null>(null);
  const delivery = cart.deliveryMode === "delivery";
  // Mudar qualquer dado depois de registrar pede um novo registro (e uma nova mensagem).
  const orderKey = JSON.stringify([form, cart.items.map(x => [x.id, x.size, x.color, x.qty]), cart.deliveryMode, cart.selectedShipping?.id, cart.coupon?.code]);
  const ready = registered?.key === orderKey ? registered : null;

  const set = (field: keyof FormData) => (e: { target: { value: string } }) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const fillAddress = (a: Address | null) => setForm(f => ({
    ...f,
    address: a?.address || "",
    district: a?.district || "",
    city: a?.city || "",
    state: a?.state || "",
    complement: f.complement || a?.complement || ""
  }));

  const handleCepLookup = async () => {
    setForm(f => ({ ...f, cep: formatCep(f.cep) }));
    setAddressNote("Consultando CEP...");
    try {
      const found = await cart.lookupCep(form.cep, { showStatus: false });
      fillAddress(found);
      setAddressNote(`Endereço encontrado: ${found.city}/${found.state}. Confira e complete número/complemento.`);
    } catch (e) {
      cart.clearAddress();
      fillAddress(null);
      setAddressNote(e instanceof Error ? e.message : "Não foi possível consultar o CEP.");
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (delivery) {
      if (!cart.selectedShipping) {
        cart.setShippingStatus("Calcule e escolha o frete para este CEP antes de enviar o pedido.");
        onBackToCart();
        return;
      }
      if (!cart.address || cleanCep(form.cep) !== cart.address.cep) {
        setNote("Consulte o CEP antes de finalizar o pedido.");
        return;
      }
    }
    if (!form.name || !form.phone || !form.email) {
      setNote("Preencha nome, WhatsApp e e-mail.");
      return;
    }
    if (sending) return;

    if (method !== "whatsapp") {
      setSending(true);
      setNote(method === "pix" ? "Gerando o Pix..." : "Abrindo o pagamento seguro do Mercado Pago...");
      const result = await startOnlinePayment(cart, form, method);
      if ("error" in result) {
        setSending(false);
        setNote(result.error);
        if (result.shippingChanged) {
          cart.setShippingStatus(result.error);
          onBackToCart();
        }
        return;
      }
      if (result.checkoutUrl) {
        // Mesma aba (não é pop-up): o cliente paga no Mercado Pago e volta para /pedido/<token>.
        window.location.href = result.checkoutUrl;
        return;
      }
      setSending(false);
      setNote("");
      setPixOrder(result);
      return;
    }

    if (!hasWhatsapp(store)) {
      setNote(`Configure o WhatsApp em src/stores/${store.id}.ts antes de usar esta etapa.`);
      return;
    }
    /*
      Abrir o WhatsApp sozinho depois de gravar o pedido é bloqueado como pop-up
      em vários navegadores. Por isso o clique só grava, e o botão vira um link
      comum para o WhatsApp, que abre em qualquer navegador.
      Se não der para registrar, o link sai mesmo assim (sem o número do pedido).
    */
    setSending(true);
    setNote("Registrando o pedido...");
    const order = await registerOrder(cart, form);
    setRegistered({ key: orderKey, order, url: whatsappUrl(store, orderMessage(store, cart, form, order)) });
    setSending(false);
    setNote(order?.couponError ? `Cupom não aplicado: ${order.couponError}` : "");
  };

  return (
    <div className="checkout-modal" role="dialog" aria-modal="true" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="checkout-card">
        <button className="modal-close" type="button" onClick={onClose}>×</button>
        {pixOrder ? (
          <>
            <p className="eyebrow">PEDIDO Nº {pixOrder.code}</p>
            {pixStatus?.paid ? (
              <div className="pix-paid">
                <h2>Pagamento aprovado! 🎉</h2>
                <p>Obrigado! Seu pedido já está em preparação. A gente te avisa pelo WhatsApp a cada etapa.</p>
                <a className="btn btn-dark full" href={`/pedido/${pixOrder.token}`}>Ver meu pedido</a>
              </div>
            ) : (
              <>
                <h2>Pague com Pix</h2>
                {pixOrder.pix && <PixPayment pix={pixOrder.pix} total={pixOrder.total} />}
                <p className="pix-later">
                  Pode fechar esta janela: o pagamento continua valendo e você acompanha em{" "}
                  <a href={`/pedido/${pixOrder.token}`}>seu pedido</a>.
                </p>
              </>
            )}
          </>
        ) : (
        <>
        <p className="eyebrow">FINALIZAR PEDIDO</p>
        <h2>Quase lá ✨</h2>
        <p className="checkout-intro">{store.texts.checkout.intro}</p>
        <form onSubmit={submit}>
          <div className="checkout-section-title">Dados do cliente</div>
          <div className="form-grid">
            <label>Nome completo
              <input name="name" required autoComplete="name" placeholder="Seu nome completo" value={form.name} onChange={set("name")} />
            </label>
            <label>WhatsApp
              <input name="phone" required inputMode="tel" autoComplete="tel" placeholder="(00) 00000-0000" value={form.phone} onChange={set("phone")} />
            </label>
          </div>
          <label>E-mail
            <input name="email" type="email" required autoComplete="email" placeholder="seuemail@email.com" value={form.email} onChange={set("email")} />
          </label>

          {delivery && (
            <>
              <div className="checkout-section-title address-title">Endereço de entrega</div>
              <p className="checkout-address-note">Digite o CEP para buscar automaticamente o logradouro, bairro, cidade e estado.</p>
              <div className="form-grid cep-checkout-grid">
                <label>CEP
                  <input
                    name="cep" required inputMode="numeric" maxLength={9} placeholder="00000-000" autoComplete="postal-code"
                    value={form.cep}
                    onChange={e => setForm(f => ({ ...f, cep: formatCep(e.target.value) }))}
                    onBlur={() => { if (cleanCep(form.cep).length === 8) handleCepLookup(); }}
                  />
                </label>
                <button className="btn btn-light cep-search-btn" type="button" onClick={handleCepLookup}>Buscar CEP</button>
              </div>
              <p className="form-note">{addressNote}</p>

              <label>Logradouro
                <input name="address" required autoComplete="street-address" placeholder="Rua, Avenida, etc." value={form.address} onChange={set("address")} />
              </label>
              <div className="form-grid form-grid-number">
                <label>Número
                  <input name="number" required inputMode="text" autoComplete="address-line2" placeholder="123" value={form.number} onChange={set("number")} />
                </label>
                <label>Complemento <span className="optional-label">(opcional)</span>
                  <input name="complement" autoComplete="address-line2" placeholder="Apto, bloco, casa..." value={form.complement} onChange={set("complement")} />
                </label>
              </div>
              <div className="form-grid">
                <label>Bairro
                  <input name="district" required autoComplete="address-level3" placeholder="Bairro" value={form.district} onChange={set("district")} />
                </label>
                <label>Cidade
                  <input name="city" required autoComplete="address-level2" placeholder="Cidade" value={form.city} onChange={set("city")} />
                </label>
              </div>
              <label>Estado (UF)
                <input name="state" required maxLength={2} autoComplete="address-level1" placeholder="MG" value={form.state} onChange={set("state")} />
              </label>
            </>
          )}

          <label>Observações
            <textarea name="notes" rows={3} placeholder="Deixar na portaria, tocar a campainha, preferência de entrega" value={form.notes} onChange={set("notes")} />
          </label>

          {onlinePayments && (
            <>
              <div className="checkout-section-title">Pagamento</div>
              <div className="pay-options" role="radiogroup" aria-label="Forma de pagamento">
                <button type="button" role="radio" aria-checked={method === "pix"} className={`pay-option ${method === "pix" ? "active" : ""}`} onClick={() => setMethod("pix")}>
                  <span><strong>Pix</strong>{pixPercent > 0 && <em>{pixPercent}% off nos produtos</em>}</span>
                  <b>{money(cart.total - pixDiscount)}</b>
                </button>
                <button type="button" role="radio" aria-checked={method === "card"} className={`pay-option ${method === "card" ? "active" : ""}`} onClick={() => setMethod("card")}>
                  <span><strong>Cartão de crédito</strong>{store.commerce.installments > 1 && <em>em até {store.commerce.installments}x</em>}</span>
                  <b>{money(cart.total)}</b>
                </button>
                <button type="button" role="radio" aria-checked={method === "whatsapp"} className={`pay-option ${method === "whatsapp" ? "active" : ""}`} onClick={() => setMethod("whatsapp")}>
                  <span><strong>Combinar pelo WhatsApp</strong><em>pagamento combinado na conversa</em></span>
                  <b>{money(cart.total)}</b>
                </button>
              </div>
            </>
          )}

          {method !== "whatsapp" ? (
            <button className="btn btn-dark full" type="submit" disabled={sending}>
              {sending ? "Aguarde..." : method === "pix" ? `Gerar Pix de ${money(cart.total - pixDiscount)}` : "Pagar com cartão"}
            </button>
          ) : ready ? (
            <div className="checkout-ready">
              {ready.order ? (
                <p>Pedido <strong>nº {ready.order.code}</strong> registrado! ✨ Agora é só enviar a mensagem:</p>
              ) : (
                <p>Não conseguimos registrar o pedido agora, mas você pode enviá-lo pelo WhatsApp do mesmo jeito.</p>
              )}
              <a className="btn btn-dark full" href={ready.url} target="_blank" rel="noopener">Abrir o WhatsApp</a>
              {!ready.order && (
                <button className="btn btn-light full" type="submit" disabled={sending}>{sending ? "Registrando..." : "Tentar registrar de novo"}</button>
              )}
            </div>
          ) : (
            <button className="btn btn-dark full" type="submit" disabled={sending}>{sending ? "Registrando..." : "Enviar pedido pelo WhatsApp"}</button>
          )}
          <p className="form-note">{note}</p>
        </form>
        </>
        )}
      </div>
    </div>
  );
}
