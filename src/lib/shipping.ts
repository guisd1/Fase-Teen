export interface ShippingOption {
  id: string;
  company: string;
  service: string;
  price: number;
  deliveryTime: number | null;
}
