/** Promoções da loja, editadas no painel (aba Promoções). Seguro para o navegador. */
export interface Promotions {
  /** Frete grátis para compras a partir deste valor em produtos (null = desligado). */
  freeShippingMin: number | null;
  /** Código do cupom mostrado a quem assina a newsletter (null = sem cupom). */
  welcomeCoupon: string | null;
  /** Próximo lançamento: contagem regressiva na página inicial. */
  launch: { title: string; date: string } | null;
}

export const DEFAULT_PROMOTIONS: Promotions = { freeShippingMin: 299, welcomeCoupon: "BEMVINDA10", launch: null };

/** Frete grátis vale só para o PAC dos Correios; as outras opções são cobradas normalmente. */
export const isFreeShippingOption = (option: { company?: string | null; service?: string | null } | null | undefined) =>
  Boolean(option && /\bpac\b/i.test(`${option.service ?? ""} ${option.company ?? ""}`));

/** O pedido alcança o valor do frete grátis? (entrega e produtos a partir do mínimo; o frete só zera no PAC) */
export const hasFreeShipping = (promo: Pick<Promotions, "freeShippingMin">, productsTotal: number) =>
  promo.freeShippingMin !== null && productsTotal >= promo.freeShippingMin - 0.001;
