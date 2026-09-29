export interface ShippingOption {
  id: string;
  company: string;
  service: string;
  /** Frete cobrado no cartão (valor da transportadora + taxa do cartão embutida). */
  price: number;
  /** Frete cobrado no Pix (valor da transportadora + taxa do Pix embutida). */
  pixPrice?: number;
  deliveryTime: number | null;
}
