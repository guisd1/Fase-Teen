import Link from "next/link";
import { getPromotions } from "@/db/settings";
import { adminListCoupons } from "@/db/coupons";
import { adminListProducts } from "@/db/products";
import { saveFlashSaleAction, savePromotionsAction } from "../../actions";

/** Data ISO → valor do campo datetime-local no horário de Brasília. */
const brLocal = (iso: string) => new Date(new Date(iso).getTime() - 3 * 60 * 60 * 1000).toISOString().slice(0, 16);

export default async function PromotionsPage({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  const query = await searchParams;
  const [promo, coupons, allProducts] = await Promise.all([getPromotions(), adminListCoupons(), adminListProducts()]);
  const shopProducts = allProducts.filter(p => p.active && p.price !== null);
  const categories = [...new Set(shopProducts.map(p => p.category).filter((c): c is string => Boolean(c)))].sort();
  const flash = promo.flash;
  const flashIds = new Set(flash?.productIds ?? []);
  const flashOver = flash?.active && new Date(flash.endsAt).getTime() <= Date.now();
  const couponOk = !promo.welcomeCoupon || coupons.some(c => c.code === promo.welcomeCoupon && c.active);

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Promoções</h1>
          <p>Frete grátis, cupom de boas-vindas da newsletter, contagem regressiva do próximo lançamento e promoção relâmpago. Promoção de um produto específico fica no cadastro do produto.</p>
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
          <p className="admin-hint">A loja paga o frete pelo PAC dos Correios dos pedidos a partir desse valor (as outras opções continuam cobradas). O carrinho mostra uma barrinha com quanto falta para ganhar.</p>
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
          {promo.launch && new Date(promo.launch.date).getTime() <= Date.now() && (
            <p className="admin-alert">A data deste lançamento já passou, então a contagem não aparece mais no site. Escolha uma nova data ou apague os dois campos.</p>
          )}
          <p className="admin-hint">Mostra uma contagem regressiva na página inicial com o convite para entrar na lista VIP (newsletter). Some sozinha quando a data chega. Deixe vazio para não mostrar.</p>
        </section>

        <div className="admin-save-bar">
          <button className="btn btn-dark" type="submit">Salvar promoções</button>
        </div>
      </form>

      <form action={saveFlashSaleAction} className="admin-form" id="relampago">
        <section className="admin-card">
          <h2>Promoção relâmpago</h2>
          <p className="admin-hint">
            Mostra uma barra com cronômetro no topo do site (ex.: <em>Só hoje: 20% OFF em moletons — termina em 05:42:10</em>), um cronômetro na página dos produtos participantes e no carrinho.
            O desconto entra nos produtos marcados no horário de início e sai sozinho no fim. O tempo é o mesmo para todo mundo (horário de Brasília).
          </p>
          <label className="admin-check">
            <input type="checkbox" name="flashOn" defaultChecked={flash?.active ?? false} />
            Promoção ligada
          </label>
          <label>Texto da barra
            <input name="flashText" defaultValue={flash?.text ?? ""} placeholder="Só hoje: 20% OFF em moletons" maxLength={90} />
          </label>
          <div className="admin-grid-2">
            <label>Desconto (%)
              <input name="flashPercent" inputMode="decimal" defaultValue={flash ? String(flash.percent).replace(".", ",") : ""} placeholder="20" />
            </label>
            <label>Link ao tocar na barra <small>opcional</small>
              <input name="flashLink" defaultValue={flash?.link ?? ""} placeholder="/#colecao" />
            </label>
            <label>Início
              <input type="datetime-local" name="flashStart" defaultValue={flash ? brLocal(flash.startsAt) : ""} />
            </label>
            <label>Fim
              <input type="datetime-local" name="flashEnd" defaultValue={flash ? brLocal(flash.endsAt) : ""} />
            </label>
          </div>
          {flashOver && <p className="admin-alert">Esta promoção já terminou e não aparece mais no site. Escolha novas datas ou desligue.</p>}

          {categories.length > 0 && (
            <fieldset className="admin-picks">
              <legend>Categorias inteiras <small>marca todos os produtos da categoria ao salvar</small></legend>
              {categories.map(c => (
                <label key={c} className="admin-check"><input type="checkbox" name="flashCategory" value={c} /> {c}</label>
              ))}
            </fieldset>
          )}
          <fieldset className="admin-picks">
            <legend>Produtos participantes</legend>
            {shopProducts.map(p => (
              <label key={p.id} className="admin-check">
                <input type="checkbox" name="flashProduct" value={p.id} defaultChecked={flashIds.has(p.id)} />
                {p.name}{p.reference ? ` (${p.reference})` : ""}{p.category ? <small> • {p.category}</small> : null}
              </label>
            ))}
          </fieldset>
          <p className="admin-hint">
            Ao salvar com a promoção ligada, o desconto e as datas são gravados na &quot;Promoção com data&quot; de cada produto marcado (substitui a que ele tiver).
            Desligar ou desmarcar um produto tira a promoção dele. Apague todos os campos e desmarque tudo para remover a promoção relâmpago.
          </p>
        </section>
        <div className="admin-save-bar">
          <button className="btn btn-dark" type="submit">Salvar promoção relâmpago</button>
        </div>
      </form>
    </>
  );
}
