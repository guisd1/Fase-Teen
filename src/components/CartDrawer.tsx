"use client";

import { useState } from "react";
import { formatCep, money } from "@/lib/format";
import type { Cart } from "./useCart";
import { mainImage } from "@/lib/product-media";
import { couponLabel } from "@/lib/coupon";
import { Icon } from "./Icons";
import { optimized } from "@/lib/image";

function CouponBox({ cart }: { cart: Cart }) {
  const [code, setCode] = useState("");
  const { coupon } = cart;
  if (coupon) {
    const belowMin = cart.discount === 0 && coupon.minSubtotal;
    return (
      <div className="coupon-box">
        <div className="coupon-applied">
          <span><strong>{coupon.code}</strong> • {couponLabel(coupon)}</span>
          <button type="button" className="remove-btn" onClick={cart.removeCoupon}>Remover</button>
        </div>
        {belowMin && <p className="shipping-status">Vale para compras a partir de {money(coupon.minSubtotal)} em produtos.</p>}
      </div>
    );
  }
  return (
    <div className="coupon-box">
      <form className="cep-row" onSubmit={e => { e.preventDefault(); cart.applyCoupon(code); }}>
        <input type="text" placeholder="Cupom de desconto" autoCapitalize="characters" value={code} onChange={e => setCode(e.target.value.toUpperCase())} />
        <button className="btn btn-light small-btn" type="submit" disabled={!code.trim()}>Aplicar</button>
      </form>
      {cart.couponStatus && <p className="shipping-status">{cart.couponStatus}</p>}
    </div>
  );
}

export default function CartDrawer({ cart, open, onClose, onCheckout, cepInputRef }: {
  cart: Cart;
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
  cepInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const { items, deliveryMode, selectedShipping } = cart;
  const delivery = deliveryMode === "delivery";

  return (
    <>
      <div className={`overlay ${open ? "" : "hidden"}`} onClick={onClose} />
      <aside className={`cart-drawer ${open ? "open" : ""}`} aria-label="Carrinho">
        <div className="drawer-head">
          <h3>Seu carrinho</h3>
          <button className="close-btn" type="button" onClick={onClose}>×</button>
        </div>

        <div className="cart-items">
          {items.map(x => (
            <div className="cart-item" key={`${x.id}|${x.size}|${x.color}`}>
              <img {...optimized(mainImage(x.product, x.color), "80px")} alt={x.product.name} />
              <div>
                <h4>{x.product.name}</h4>
                <small>Tamanho: {x.size || "-"} • Cor: {x.color || "-"}</small>
                <div className="cart-item-price">{money(x.product.price)}</div>
                <div className="qty">
                  <button type="button" onClick={() => cart.changeQty(x, -1)}>−</button>
                  <strong>{x.qty}</strong>
                  <button type="button" disabled={!cart.canIncrease(x)} onClick={() => cart.changeQty(x, 1)}>+</button>
                </div>
                <button className="remove-btn" type="button" onClick={() => cart.removeItem(x)}>Remover</button>
              </div>
            </div>
          ))}
        </div>

        {items.length === 0 ? (
          <div className="cart-empty">
            <div className="empty-icon"><Icon name="bag" /></div>
            <p>Seu carrinho está vazio.</p>
            <button className="btn btn-dark" type="button" onClick={onClose}>Continuar comprando</button>
          </div>
        ) : (
          <div className="cart-footer">
            {cart.freeShippingMin !== null && (
              <div className={`free-shipping ${cart.freeShipping ? "done" : ""}`}>
                <p>
                  {cart.freeShipping || cart.missingForFreeShipping === 0
                    ? <><strong>Frete grátis</strong> garantido para este pedido!</>
                    : <>Faltam <strong>{money(cart.missingForFreeShipping)}</strong> para ganhar <strong>frete grátis</strong></>}
                </p>
                <div className="free-shipping-bar"><span style={{ width: `${Math.min(100, (cart.subtotal / cart.freeShippingMin) * 100)}%` }} /></div>
              </div>
            )}
            <div className="shipping-box">
              <div className="shipping-title-row">
                <strong>Como você quer receber?</strong>
                <span>Escolha uma opção</span>
              </div>
              <div className="shipping-choice-row">
                <button className={`shipping-choice ${delivery ? "active" : ""}`} type="button" onClick={() => cart.setDeliveryMode("delivery")}>Entrega</button>
                <button className={`shipping-choice ${delivery ? "" : "active"}`} type="button" onClick={() => cart.setDeliveryMode("pickup")}>Retirada na loja</button>
              </div>
              {delivery && (
                <div>
                  <div className="cep-row">
                    <input
                      ref={cepInputRef}
                      type="text"
                      inputMode="numeric"
                      maxLength={9}
                      placeholder="Digite seu CEP"
                      autoComplete="postal-code"
                      value={formatCep(cart.cep)}
                      onChange={e => cart.setCep(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); cart.calculateFreight(); } }}
                    />
                    <button className="btn btn-dark small-btn" type="button" disabled={Boolean(cart.calculating)} onClick={cart.calculateFreight}>
                      {cart.calculating === "validating" ? "Validando..." : cart.calculating === "calculating" ? "Calculando..." : "Calcular"}
                    </button>
                  </div>
                </div>
              )}
              <p className="shipping-status">{cart.shippingStatus}</p>
              {delivery && (
                <div className="shipping-options">
                  {cart.shippingOptions.map(o => (
                    <button
                      key={o.id}
                      className={`shipping-option ${selectedShipping?.id === o.id ? "selected" : ""}`}
                      type="button"
                      onClick={() => cart.setSelectedShipping(o)}
                    >
                      <div>
                        <strong>{o.company}{o.service ? ` • ${o.service}` : ""}</strong>
                        <small>{o.deliveryTime ? `Prazo estimado: ${o.deliveryTime} dias úteis` : "Prazo não informado"}</small>
                      </div>
                      <span className="shipping-price">{cart.freeShipping ? <><s>{money(o.price)}</s> Grátis</> : money(o.price)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <CouponBox cart={cart} />
            <div className="totals-row"><span>Subtotal</span><strong>{money(cart.subtotal)}</strong></div>
            {cart.discount > 0 && (
              <div className="totals-row discount-row"><span>Desconto ({cart.coupon?.code})</span><strong>− {money(cart.discount)}</strong></div>
            )}
            <div className="totals-row freight-total-row">
              <span>Frete</span>
              <strong>{cart.freight === null ? (cart.freeShipping ? "Grátis (escolha o envio)" : "A calcular") : cart.freight === 0 && cart.freeShipping ? "Grátis" : money(cart.freight)}</strong>
            </div>
            <div className="totals-row grand-total-row"><span>Total</span><strong>{money(cart.total)}</strong></div>
            <p className="mini-note">O valor do frete é calculado conforme o CEP e a opção de envio escolhida.</p>
            <button className="btn btn-dark full" type="button" onClick={onCheckout}>Finalizar pedido</button>
          </div>
        )}
      </aside>
    </>
  );
}
