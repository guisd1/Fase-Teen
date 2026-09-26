import { isAdmin } from "@/lib/auth";
import { adminListOrders } from "@/db/orders";
import { adminCustomers } from "@/db/insights";
import { STATUS_LABELS, isOrderStatus } from "@/lib/order-status";
import { METHOD_LABELS } from "@/lib/payment-labels";
import { SOURCE_LABELS } from "@/lib/traffic-source";

export const dynamic = "force-dynamic";

/*
  Planilhas para abrir no Excel / Google Planilhas:
    /admin/exportar/pedidos   todos os pedidos
    /admin/exportar/clientes  clientes agrupados pelo telefone
  Separador ";" e vírgula nos decimais (padrão do Excel em português).
*/

const dateTime = (d: Date) => d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
const num = (n: number) => n.toFixed(2).replace(".", ",");

function cell(value: unknown) {
  let s = value === null || value === undefined ? "" : String(value);
  // Evita que o Excel trate um texto como fórmula.
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const csv = (rows: unknown[][]) => "﻿" + rows.map(r => r.map(cell).join(";")).join("\r\n");

export async function GET(_: Request, { params }: { params: Promise<{ tipo: string }> }) {
  if (!(await isAdmin())) return new Response("Acesso restrito ao administrador.", { status: 401 });
  const { tipo } = await params;
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  let rows: unknown[][];

  if (tipo === "pedidos") {
    const orders = await adminListOrders();
    rows = [
      ["Pedido", "Data", "Status", "Cliente", "Telefone", "E-mail", "Itens", "Produtos (R$)", "Desconto cupom (R$)", "Cupom",
        "Desconto Pix (R$)", "Frete (R$)", "Total (R$)", "Pagamento", "Pago em", "Entrega", "Cidade", "UF", "Rastreio", "Origem", "Campanha"],
      ...orders.map(o => [
        o.code, dateTime(o.createdAt), isOrderStatus(o.status) ? STATUS_LABELS[o.status] : o.status,
        o.customerName, o.customerPhone, o.customerEmail,
        o.items.map(i => `${i.qty}x ${i.name}${i.size ? ` (${i.size})` : ""}${i.color ? ` ${i.color}` : ""}`).join(" | "),
        num(o.subtotal), num(o.discount), o.couponCode, num(o.paymentDiscount), num(o.freight), num(o.total),
        METHOD_LABELS[o.paymentMethod] ?? o.paymentMethod, o.paidAt ? dateTime(o.paidAt) : "",
        o.deliveryMode === "pickup" ? "Retirada" : [o.shipping?.company, o.shipping?.service].filter(Boolean).join(" "),
        o.address?.city ?? "", o.address?.state ?? "", o.trackingCode, o.source ? SOURCE_LABELS[o.source] ?? o.source : "", o.campaign
      ])
    ];
  } else if (tipo === "clientes") {
    const customers = (await adminCustomers()).sort((a, b) => b.spent - a.spent);
    rows = [
      ["Nome", "Telefone", "E-mail", "Pedidos confirmados", "Total gasto (R$)", "Todos os pedidos", "Último pedido", "Veio de"],
      ...customers.map(c => [c.name, c.phone, c.email, c.orders, num(c.spent), c.allOrders, dateTime(c.lastOrder),
        c.firstSource ? SOURCE_LABELS[c.firstSource] ?? c.firstSource : ""])
    ];
  } else {
    return new Response("Planilha não encontrada.", { status: 404 });
  }

  return new Response(csv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${tipo}-${today}.csv"`,
      "Cache-Control": "no-store"
    }
  });
}
