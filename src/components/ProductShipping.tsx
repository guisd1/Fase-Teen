"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/db/products";
import type { ShippingOption } from "@/lib/shipping";
import { cleanCep, formatCep, money } from "@/lib/format";
import { isFreeShippingOption } from "@/lib/promotions";
import { useShop } from "./ShopShell";
import { Icon } from "./Icons";

/** Frete e prazo de 1 peça na página do produto (não mexe no frete escolhido no carrinho). */
export default function ProductShipping({ product }: { product: Product }) {
  const { cart, promotions } = useShop();
  const [cep, setCep] = useState("");
  const [touched, setTouched] = useState(false);
  const [options, setOptions] = useState<ShippingOption[] | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  // Já vem com o CEP que a cliente digitou no carrinho (salvo no navegador).
  useEffect(() => {
    if (!touched && cart.cep) setCep(cart.cep);
  }, [cart.cep, touched]);

  const free = promotions.freeShippingMin !== null && product.price >= promotions.freeShippingMin - 0.001;

  const calculate = async () => {
    if (cep.length !== 8) {
      setStatus("Digite um CEP válido com 8 números.");
      return;
    }
    setLoading(true);
    setStatus("");
    setOptions(null);
    try {
      const r = await fetch("/api/frete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postalCode: cep, items: [{ id: product.id, quantity: 1 }] })
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Não foi possível calcular o frete.");
      const list: ShippingOption[] = Array.isArray(data.options) ? data.options : [];
      setOptions(list);
      if (!list.length) setStatus("Nenhuma opção de envio para este CEP. Você pode retirar na loja ou falar com a gente no WhatsApp.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Erro ao calcular o frete.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pdp-shipping">
      <strong><Icon name="truck" /> Frete e prazo</strong>
      <form className="cep-row" onSubmit={e => { e.preventDefault(); calculate(); }}>
        <input
          type="text"
          inputMode="numeric"
          maxLength={9}
          placeholder="Digite seu CEP"
          autoComplete="postal-code"
          aria-label="CEP"
          value={formatCep(cep)}
          onChange={e => { setTouched(true); setCep(cleanCep(e.target.value)); setOptions(null); }}
        />
        <button className="btn btn-light small-btn" type="submit" disabled={loading}>{loading ? "Calculando..." : "Calcular"}</button>
      </form>
      {status && <p className="shipping-status">{status}</p>}
      {options && options.length > 0 && (
        <ul className="pdp-shipping-options">
          {options.map(o => (
            <li key={o.id}>
              <span>
                <strong>{o.company}{o.service ? ` • ${o.service}` : ""}</strong>
                <small>{o.deliveryTime ? `Chega em até ${o.deliveryTime} dias úteis após a postagem` : "Prazo não informado"}</small>
              </span>
              <b>{free && isFreeShippingOption(o) ? "Grátis" : money(o.price)}</b>
            </li>
          ))}
        </ul>
      )}
      {options && options.length > 0 && <p className="mini-note">Valor para 1 peça. No carrinho, o frete é calculado com todos os itens.</p>}
    </div>
  );
}
