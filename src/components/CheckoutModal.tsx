"use client";

import { useState, type FormEvent } from "react";
import type { StoreConfig } from "@/stores/types";
import { cleanCep, formatCep, money } from "@/lib/format";
import { hasWhatsapp, whatsappUrl } from "@/lib/whatsapp";
import type { Address, Cart } from "./useCart";

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

function orderMessage(store: StoreConfig, cart: Cart, data: FormData) {
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
  return [
    `Olá! Quero fazer um pedido na *${store.name}*.`, "",
    "*Produtos:*", ...cart.items.map(x => `• ${x.product.name} | Tam. ${x.size} | Cor: ${x.color} | Qtd: ${x.qty} | ${money(x.product.price * x.qty)}`), "",
    `*Subtotal:* ${money(cart.subtotal)}`, `*Entrega:* ${delivery}`, `*TOTAL:* ${money(cart.total)}`, "",
    `*Nome:* ${data.name}`, `*WhatsApp:* ${data.phone}`, `*E-mail:* ${data.email}`,
    ...addressLines,
    `*Observações:* ${data.notes || "Não informado"}`, "", "Aguardo confirmação de estoque, pagamento e envio."
  ].join("\n");
}

export default function CheckoutModal({ store, cart, onClose, onBackToCart }: {
  store: StoreConfig;
  cart: Cart;
  onClose: () => void;
  onBackToCart: () => void;
}) {
  const [form, setForm] = useState<FormData>(() => initialForm(cart));
  const [addressNote, setAddressNote] = useState("");
  const [note, setNote] = useState("");
  const delivery = cart.deliveryMode === "delivery";

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

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (delivery) {
      if (!cart.selectedShipping) {
        cart.setShippingStatus("Selecione o frete antes de enviar o pedido.");
        onBackToCart();
        return;
      }
      if (!cart.address || cleanCep(form.cep) !== cart.address.cep) {
        setNote("Consulte o CEP antes de finalizar o pedido.");
        return;
      }
    }
    if (!hasWhatsapp(store)) {
      setNote(`Configure o WhatsApp em src/stores/${store.id}.ts antes de usar esta etapa.`);
      return;
    }
    if (!form.name || !form.phone || !form.email) {
      setNote("Preencha nome, WhatsApp e e-mail.");
      return;
    }
    window.open(whatsappUrl(store, orderMessage(store, cart, form)), "_blank", "noopener");
    setNote("Pedido preparado no WhatsApp. Confira a mensagem antes de enviar.");
  };

  return (
    <div className="checkout-modal" role="dialog" aria-modal="true" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="checkout-card">
        <button className="modal-close" type="button" onClick={onClose}>×</button>
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
          <button className="btn btn-dark full" type="submit">Enviar pedido pelo WhatsApp</button>
          <p className="form-note">{note}</p>
        </form>
      </div>
    </div>
  );
}
