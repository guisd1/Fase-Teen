/** Promoções da loja, editadas no painel (aba Promoções). Seguro para o navegador. */
export interface Promotions {
  /** Frete grátis para compras a partir deste valor em produtos (null = desligado). */
  freeShippingMin: number | null;
  /** Código do cupom mostrado a quem assina a newsletter (null = sem cupom). */
  welcomeCoupon: string | null;
  /** Próximo lançamento: contagem regressiva na página inicial. */
  launch: { title: string; date: string } | null;
  /** "Últimas X no tamanho M" na página do produto quando o estoque do tamanho é até este número (null = desligado). */
  lowStockLimit: number | null;
  /** Promoção relâmpago: barra com cronômetro no topo e desconto nos produtos participantes. */
  flash: FlashSale | null;
}

export interface FlashSale {
  /** Desligada no painel: a configuração fica guardada, mas nada aparece e o desconto não vale. */
  active: boolean;
  /** Texto da barra, ex.: "Só hoje: 20% OFF em moletons". */
  text: string;
  /** Para onde a barra leva ao tocar (null = não é clicável). */
  link: string | null;
  percent: number;
  startsAt: string;
  endsAt: string;
  productIds: number[];
}

export const DEFAULT_PROMOTIONS: Promotions = { freeShippingMin: 299, welcomeCoupon: "BEMVINDA10", launch: null, lowStockLimit: 5, flash: null };

/** A promoção relâmpago está valendo neste instante? */
export const flashLive = (flash: FlashSale | null, now: number) =>
  Boolean(flash?.active && now >= Date.parse(flash.startsAt) && now < Date.parse(flash.endsAt));

/** Frete grátis vale só para o PAC dos Correios; as outras opções são cobradas normalmente. */
export const isFreeShippingOption = (option: { company?: string | null; service?: string | null } | null | undefined) =>
  Boolean(option && /\bpac\b/i.test(`${option.service ?? ""} ${option.company ?? ""}`));

/** O pedido alcança o valor do frete grátis? (entrega e produtos a partir do mínimo; o frete só zera no PAC) */
export const hasFreeShipping = (promo: Pick<Promotions, "freeShippingMin">, productsTotal: number) =>
  promo.freeShippingMin !== null && productsTotal >= promo.freeShippingMin - 0.001;
