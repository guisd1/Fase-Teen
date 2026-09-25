import Link from "next/link";
import { adminListReviews } from "@/db/reviews";
import { productSlug } from "@/db/products";
import { deleteReview, setReviewApproved } from "../../actions";

const stars = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

export default async function ReviewsPage() {
  const reviews = await adminListReviews();
  const pending = reviews.filter(r => !r.approved).length;

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Avaliações</h1>
          <p>{pending ? `${pending} aguardando aprovação. ` : ""}Só as aprovadas aparecem na página do produto.</p>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="admin-empty"><p>Nenhuma avaliação ainda. Os clientes avaliam pela página de cada produto.</p></div>
      ) : (
        <div className="admin-reviews">
          {reviews.map(r => (
            <article key={r.id} className={`admin-card admin-review ${r.approved ? "" : "is-pending"}`}>
              <div className="admin-integration-head">
                <div>
                  <span className="admin-stars">{stars(r.rating)}</span> <strong>{r.name}</strong>
                  <small className="admin-review-meta">
                    {" "}em <Link href={`/produto/${productSlug({ id: r.productId, name: r.productName })}#avaliacoes`} target="_blank">{r.productName}</Link>
                    {" • "}{r.createdAt.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                  </small>
                </div>
                <span className={`admin-status ${r.approved ? "ok" : "status-pendente"}`}>{r.approved ? "Publicada" : "Aguardando"}</span>
              </div>
              {r.comment && <p className="admin-review-text">{r.comment}</p>}
              {r.images.length > 0 && (
                <div className="admin-review-images">
                  {r.images.map(src => <a key={src} href={src} target="_blank" rel="noopener"><img src={src} alt="" /></a>)}
                </div>
              )}
              <div className="admin-row">
                <form action={setReviewApproved.bind(null, r.id, !r.approved)}>
                  <button className={`btn ${r.approved ? "btn-light" : "btn-dark"}`} type="submit">{r.approved ? "Ocultar do site" : "Aprovar"}</button>
                </form>
                <form action={deleteReview.bind(null, r.id)}>
                  <button className="btn btn-light admin-danger" type="submit">Excluir</button>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
