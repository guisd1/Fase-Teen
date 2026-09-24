"use client";

import { formatCep, money } from "@/lib/format";
import type { Cart } from "./useCart";
import { mainImage } from "@/lib/product-media";

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
              <img src={mainImage(x.product)} alt={x.product.name} />
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
            <div className="empty-icon">🛍</div>
            <p>Seu carrinho está vazio.</p>
            <button className="btn btn-dark" type="button" onClick={onClose}>Continuar comprando</button>
          </div>
        ) : (
          <div className="cart-footer">
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
                      <span className="shipping-price">{money(o.price)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="totals-row"><span>Subtotal</span><strong>{money(cart.subtotal)}</strong></div>
            <div className="totals-row freight-total-row">
              <span>Frete</span>
              <strong>{cart.freight === null ? "A calcular" : money(cart.freight)}</strong>
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
