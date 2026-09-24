import Link from "next/link";
import { adminListProducts, productSlug } from "@/db/products";
import { money } from "@/lib/format";
import { mainImage } from "@/lib/product-media";
import { setProductActive } from "../../actions";

export default async function ProductsPage() {
  const products = await adminListProducts();

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Produtos</h1>
          <p>{products.length} produto(s) cadastrado(s)</p>
        </div>
        <Link className="btn btn-dark" href="/admin/produtos/novo">+ Novo produto</Link>
      </div>

      {products.length === 0 ? (
        <div className="admin-empty">
          <p>Nenhum produto ainda.</p>
          <Link className="btn btn-dark" href="/admin/produtos/novo">Cadastrar o primeiro produto</Link>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th></th><th>Produto</th><th>Preço</th><th>Estoque</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {products.map(p => {
                const stock = p.sizes.reduce((s, x) => s + x.stock, 0);
                const image = mainImage(p);
                const status = !p.active ? "Inativo" : p.price === null ? "Rascunho (sem preço)" : "No site";
                return (
                  <tr key={p.id}>
                    <td>{image ? <img className="admin-thumb" src={image} alt="" /> : <div className="admin-thumb" />}</td>
                    <td>
                      <Link href={`/admin/produtos/${p.id}`}><strong>{p.name}</strong></Link>
                      <small>{[p.reference, p.category].filter(Boolean).join(" • ") || "—"}</small>
                    </td>
                    <td>{p.price === null ? "—" : money(p.price)}</td>
                    <td>{p.sizes.length ? `${stock} un.` : "—"}</td>
                    <td>
                      <span className={`admin-status ${status === "No site" ? "ok" : ""}`}>{status}</span>
                    </td>
                    <td className="admin-row-actions">
                      <Link href={`/admin/produtos/${p.id}`}>Editar</Link>
                      {p.active && p.price !== null && <a href={`/produto/${productSlug(p)}`} target="_blank" rel="noopener">Ver</a>}
                      <form action={setProductActive.bind(null, p.id, !p.active)}>
                        <button type="submit">{p.active ? "Desativar" : "Ativar"}</button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
