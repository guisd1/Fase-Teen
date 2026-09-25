import { getStore } from "@/stores";
import { blobMode } from "@/lib/blob";
import { melhorEnvioStatus } from "@/lib/melhor-envio";
import { getYoutubeRedirectUri, youtubeClientIdLooksValid, youtubeConfigured, youtubeConnected } from "@/lib/youtube";
import { disconnectYoutubeAction } from "../../actions";

const ME_TOKENS_URL = "https://melhorenvio.com.br/painel/gerenciar/tokens";

function Notice({ value }: { value?: string }) {
  if (!value) return null;
  return value === "ok"
    ? <p className="admin-ok">Conectado com sucesso!</p>
    : <p className="admin-error">{value}</p>;
}

export default async function IntegrationsPage({ searchParams }: {
  searchParams: Promise<{ youtube?: string; melhorenvio?: string }>;
}) {
  const query = await searchParams;
  const store = getStore();
  const [me, yt] = await Promise.all([melhorEnvioStatus(), youtubeConnected()]);
  const ytReady = youtubeConfigured();
  const blobReady = blobMode() !== null;

  const meLabel = { connected: "Conectado", expired: "Autorização expirada", disconnected: "Não conectado", "no-redis": "Redis não configurado" }[me];

  return (
    <>
      <div className="admin-head"><h1>Integrações</h1></div>

      <section className="admin-card">
        <div className="admin-integration-head">
          <h2>🚚 Melhor Envio</h2>
          <span className={`admin-status ${me === "connected" ? "ok" : ""}`}>{meLabel}</span>
        </div>
        <Notice value={query.melhorenvio} />
        <p>Calcula o frete no carrinho. A chave da API não fica guardada no painel.</p>
        <div className="admin-row">
          <a className="btn btn-light" href={ME_TOKENS_URL} target="_blank" rel="noopener">Abrir chaves da API no Melhor Envio ↗</a>
          <a className="btn btn-dark" href="/api/melhor-envio/authorize">{me === "connected" ? "Reconectar" : "Conectar"}</a>
        </div>
        <p className="admin-hint">A autorização vale 45 dias e é renovada automaticamente enquanto houver cotações.</p>
      </section>

      <section className="admin-card">
        <div className="admin-integration-head">
          <h2>▶ YouTube</h2>
          <span className={`admin-status ${yt ? "ok" : ""}`}>{yt ? "Conectado" : "Não conectado"}</span>
        </div>
        <Notice value={query.youtube} />
        <p>Envie vídeos de produto direto para o canal da {store.name} pelo cadastro de produtos.</p>
        {!ytReady ? (
          <div className="admin-alert">
            <strong>Configuração pendente.</strong> Crie as credenciais no Google Cloud e cadastre{" "}
            <code>GOOGLE_CLIENT_ID</code> e <code>GOOGLE_CLIENT_SECRET</code> na Vercel. URI de redirecionamento autorizado:{" "}
            <code>{getYoutubeRedirectUri()}</code>
          </div>
        ) : !youtubeClientIdLooksValid() ? (
          <div className="admin-alert">
            <strong>O GOOGLE_CLIENT_ID parece errado.</strong> Ele deve terminar em <code>.apps.googleusercontent.com</code>.
            Confira na Vercel se não foi colada a chave secreta no lugar do ID e faça um Redeploy.
          </div>
        ) : (
          <div className="admin-row">
            <a className="btn btn-dark" href="/api/youtube/authorize">{yt ? "Reconectar canal" : "Conectar canal do YouTube"}</a>
            {yt && <form action={disconnectYoutubeAction}><button className="btn btn-light" type="submit">Desconectar</button></form>}
          </div>
        )}
        <p className="admin-hint">
          Enquanto o projeto do Google Cloud não passar pela auditoria da API do YouTube, os vídeos enviados pelo painel
          ficam privados. Limite do YouTube: cerca de 6 envios por dia.
        </p>
      </section>

      <section className="admin-card">
        <div className="admin-integration-head">
          <h2>🖼 Fotos (Vercel Blob)</h2>
          <span className={`admin-status ${blobReady ? "ok" : ""}`}>{blobReady ? "Configurado" : "Não configurado"}</span>
        </div>
        <p>Armazena as fotos dos produtos (1 GB grátis). Fotos removidas de um produto são apagadas automaticamente.</p>
        {!blobReady && <p className="admin-alert">Na Vercel: Storage → Create → Blob, e conecte ao projeto da loja.</p>}
      </section>

      <section className="admin-card admin-muted">
        <div className="admin-integration-head">
          <h2>💳 Mercado Pago</h2>
          <span className="admin-status">Em breve</span>
        </div>
        <p>Pagamento por Pix (com QR Code e desconto) e cartão de crédito.</p>
      </section>
    </>
  );
}
