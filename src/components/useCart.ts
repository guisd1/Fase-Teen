"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Product } from "@/db/products";
import { cleanCep, formatCep } from "@/lib/format";
import type { ShippingOption } from "@/lib/shipping";

export interface CartItem {
  id: number;
  size: string;
  color: string;
  qty: number;
}

export interface Address {
  cep: string;
  address: string;
  complement: string;
  district: string;
  city: string;
  state: string;
}

export type DeliveryMode = "delivery" | "pickup";

interface SavedCheckout {
  deliveryMode?: DeliveryMode;
  cep?: string;
  address?: Address | null;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}

const sameLine = (a: CartItem, id: number, size: string, color: string) =>
  a.id === id && a.size === size && a.color === color;

export function useCart(storeId: string, products: Product[]) {
  const cartKey = `${storeId}:cart`;
  const checkoutKey = `${storeId}:checkout`;

  const [hydrated, setHydrated] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [deliveryMode, setDeliveryModeState] = useState<DeliveryMode>("delivery");
  const [cep, setCepState] = useState("");
  const [address, setAddress] = useState<Address | null>(null);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [shippingStatus, setShippingStatus] = useState("");
  const [calculating, setCalculating] = useState<"" | "validating" | "calculating">("");

  // O carrinho fica salvo no navegador, separado por loja.
  useEffect(() => {
    const saved = readJson<SavedCheckout>(checkoutKey, {});
    setCart(readJson<CartItem[]>(cartKey, []));
    setDeliveryModeState(saved.deliveryMode === "pickup" ? "pickup" : "delivery");
    setCepState(saved.cep || "");
    setAddress(saved.address || null);
    setHydrated(true);
  }, [cartKey, checkoutKey]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(cartKey, JSON.stringify(cart));
  }, [hydrated, cartKey, cart]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(checkoutKey, JSON.stringify({ deliveryMode, cep, address }));
  }, [hydrated, checkoutKey, deliveryMode, cep, address]);

  useEffect(() => {
    if (!hydrated) return;
    if (deliveryMode === "pickup") setShippingStatus("Frete R$ 0,00 para retirada na loja.");
    else setShippingStatus(address ? `CEP confirmado: ${formatCep(address.cep)}.` : "");
    // Só reage à troca de modo; as buscas de CEP e frete atualizam a mensagem por conta própria.
  }, [hydrated, deliveryMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetShipping = () => {
    setShippingOptions([]);
    setSelectedShipping(null);
  };

  const items = useMemo(
    () => cart
      .map(i => ({ ...i, product: products.find(p => p.id === i.id) }))
      .filter((x): x is CartItem & { product: Product } => Boolean(x.product)),
    [cart, products]
  );
  const count = cart.reduce((s, x) => s + x.qty, 0);
  const subtotal = items.reduce((s, x) => s + x.product.price * x.qty, 0);
  const freight = deliveryMode === "pickup" ? 0 : (selectedShipping ? Number(selectedShipping.price) : null);
  const total = subtotal + (freight ?? 0);

  const addToCart = (item: CartItem) => {
    setCart(current => {
      const found = current.find(x => sameLine(x, item.id, item.size, item.color));
      return found
        ? current.map(x => (x === found ? { ...x, qty: x.qty + item.qty } : x))
        : [...current, item];
    });
    resetShipping();
  };

  const changeQty = (line: CartItem, delta: number) => {
    setCart(current => current
      .map(x => (sameLine(x, line.id, line.size, line.color) ? { ...x, qty: x.qty + delta } : x))
      .filter(x => x.qty > 0));
    resetShipping();
  };

  const removeItem = (line: CartItem) => {
    setCart(current => current.filter(x => !sameLine(x, line.id, line.size, line.color)));
    resetShipping();
  };

  const setDeliveryMode = (mode: DeliveryMode) => {
    setDeliveryModeState(mode);
    if (mode === "pickup") resetShipping();
  };

  const setCep = (value: string) => {
    setCepState(cleanCep(value));
    setAddress(null);
    resetShipping();
  };

  const lookupCep = useCallback(async (value: string, { showStatus = true } = {}): Promise<Address> => {
    const clean = cleanCep(value);
    if (clean.length !== 8) throw new Error("Digite um CEP válido com 8 números.");
    const response = await fetch(`https://viacep.com.br/ws/${clean}/json/`, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("Não foi possível consultar o CEP agora. Tente novamente.");
    const data = await response.json();
    if (data.erro) throw new Error("CEP não encontrado. Confira o CEP informado.");
    const found: Address = {
      cep: clean,
      address: String(data.logradouro || "").trim(),
      complement: String(data.complemento || "").trim(),
      district: String(data.bairro || "").trim(),
      city: String(data.localidade || "").trim(),
      state: String(data.uf || "").trim().toUpperCase()
    };
    setCepState(clean);
    setAddress(found);
    setShippingOptions([]);
    setSelectedShipping(null);
    if (showStatus) setShippingStatus(`CEP encontrado: ${found.city}/${found.state}. Agora calcule o frete.`);
    return found;
  }, []);

  const clearAddress = () => setAddress(null);

  const calculateFreight = async () => {
    if (!cart.length) return;
    if (cep.length !== 8) {
      setShippingStatus("Digite um CEP válido com 8 números.");
      return;
    }
    setCalculating("validating");
    setShippingStatus("Validando o CEP...");
    resetShipping();
    try {
      await lookupCep(cep);
      setCalculating("calculating");
      setShippingStatus("Consultando as opções de envio...");
      const r = await fetch("/api/frete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postalCode: cep, items: cart.map(i => ({ id: i.id, quantity: i.qty })) })
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Não foi possível calcular o frete.");
      const options: ShippingOption[] = Array.isArray(data.options) ? data.options : [];
      setShippingOptions(options);
      setShippingStatus(options.length ? "Escolha uma opção de envio:" : "CEP válido, mas nenhuma opção de envio foi encontrada.");
    } catch (e) {
      setShippingStatus(e instanceof Error ? e.message : "Erro ao calcular o frete.");
    } finally {
      setCalculating("");
    }
  };

  return {
    items, count, subtotal, freight, total,
    addToCart, changeQty, removeItem,
    deliveryMode, setDeliveryMode,
    cep, setCep, address, lookupCep, clearAddress,
    shippingOptions, selectedShipping, setSelectedShipping,
    shippingStatus, setShippingStatus, calculating, calculateFreight
  };
}

export type Cart = ReturnType<typeof useCart>;
