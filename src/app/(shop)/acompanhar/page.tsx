import type { Metadata } from "next";
import { getStore } from "@/stores";
import OrderLookup from "@/components/OrderLookup";
import { whatsappUrl } from "@/lib/whatsapp";

export function generateMetadata(): Metadata {
  return { title: `Acompanhar pedido | ${getStore().name}` };
}

export default function TrackOrderPage() {
  const store = getStore();
  return (
    <main className="institutional order-lookup-page">
      <h1>Acompanhar pedido</h1>
      <p>Digite o número do pedido e o e-mail ou telefone que você usou na compra para ver o status, o pagamento e o rastreio.</p>
      <OrderLookup />
      <p className="order-lookup-help">
        Não encontrou o número do pedido? Ele está na mensagem de confirmação. Se precisar, <a href={whatsappUrl(store)} target="_blank" rel="noopener">fale com a gente no WhatsApp</a>.
      </p>
    </main>
  );
}
