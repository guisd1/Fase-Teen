import Link from "next/link";
import { getPromotions } from "@/db/settings";
import { adminListCoupons } from "@/db/coupons";
import { savePromotionsAction } from "../../actions";

/** Data ISO → valor do campo datetime-local no horário de Brasília. */
const brLocal = (iso: string) => new Date(new Date(iso).getTime() - 3 * 60 * 60 * 1000).toISOString().slice(0, 16);

export default async function PromotionsPage({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  const query = await searchParams;
  const [promo, coupons] = await Promise.all([getPromotions(), adminListCoupons()]);
  const couponOk = !promo.welcomeCoupon || coupons.some(c => c.code === promo.welcomeCoupon && c.active);

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Promoções</h1>
          <p>Frete grátis, cupom de boas-vindas da newsletter e contagem regressiva do próximo lançamento. Promoção de um produto específico fica no cadastro do produto.</p>
        </div>
      </div>
      {query.ok && <p className="admin-ok">Promoções salvas! O site já está atualizado.</p>}
      {query.erro && <p className="admin-alert">{query.erro}</p>}

      <form action={savePromotionsAction} className="admin-form">
        <section className="admin-card">
          <h2>Frete grátis</h2>
          <label className="admin-check">
            <input type="checkbox" name="freeShippingOn" defaultChecked={promo.freeShippingMin !== null} />
            Oferecer frete grátis
          </label>
          <label>A partir de (R$ em produtos)
            <input name="freeShippingMin" inputMode="decimal" defaultValue={promo.freeShippingMin !== null ? String(promo.freeShippingMin).replace(".", ",") : "299"} />
          </label>
          <p className="admin-hint">A loja paga o frete dos pedidos com entrega a partir desse valor. O carrinho mostra uma barrinha com quanto falta para ganhar.</p>
        </section>

        <section className="admin-card">
          <h2>Cupom de boas-vindas (newsletter)</h2>
          <label>Código do cupom mostrado a quem assina a newsletter
            <input name="welcomeCoupon" defaultValue={promo.welcomeCoupon ?? ""} placeholder="BEMVINDA10" />
          </label>
          {!couponOk && (
            <p className="admin-alert">
              O cupom {promo.welcomeCoupon} não existe ou está desativado. Crie em <Link href="/admin/cupons">Cupons</Link> ou troque o código aqui.
            </p>
          )}
          <p className="admin-hint">Deixe vazio para a newsletter não mostrar cupom. O desconto e as regras do cupom ficam na aba Cupons.</p>
        </section>

        <section className="admin-card">
          <h2>Próximo lançamento</h2>
          <div className="admin-grid-2">
            <label>Nome do lançamento
              <input name="launchTitle" defaultValue={promo.launch?.title ?? ""} placeholder="Coleção Verão" maxLength={80} />
            </label>
            <label>Data e hora
              <input type="datetime-local" name="launchDate" defaultValue={promo.launch ? brLocal(promo.launch.date) : ""} />
            </label>
          </div>
          <p className="admin-hint">Mostra uma contagem regressiva na página inicial com o convite para entrar na lista VIP (newsletter). Some sozinha quando a data chega. Deixe vazio para não mostrar.</p>
        </section>

        <div className="admin-save-bar">
          <button className="btn btn-dark" type="submit">Salvar promoções</button>
        </div>
      </form>
    </>
  );
}
