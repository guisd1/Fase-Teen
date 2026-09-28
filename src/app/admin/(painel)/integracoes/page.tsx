import { getStore } from "@/stores";
import { blobMode } from "@/lib/blob";
import { melhorEnvioStatus } from "@/lib/melhor-envio";
import { checkCredentials, getLastError, mercadoPagoConfigured, mercadoPagoTestMode, webhookUrl } from "@/lib/mercado-pago";
import { getYoutubeRedirectUri, youtubeClientIdLooksValid, youtubeConfigured, youtubeConnected } from "@/lib/youtube";
import { disconnectYoutubeAction, saveLabelSenderAction, saveOrderEmailAction, savePaymentFeesAction } from "../../actions";
import { getLabelSender, getOrderEmailSettings, getSavedFees } from "@/db/settings";
import { cardPrice, pixPrice } from "@/lib/pricing";
import { money } from "@/lib/format";

const ME_TOKENS_URL = "https://melhorenvio.com.br/painel/gerenciar/tokens";

function Notice({ value }: { value?: string }) {
  if (!value) return null;
  return value === "ok"
    ? <p className="admin-ok">Conectado com sucesso!</p>
    : <p className="admin-error">{value}</p>;
}

export default async function IntegrationsPage({ searchParams }: {
  searchParams: Promise<{ youtube?: string; melhorenvio?: string; taxas?: string; remetente?: string; aviso?: string }>;
}) {
  const query = await searchParams;
  const store = getStore();
  const [me, yt] = await Promise.all([melhorEnvioStatus(), youtubeConnected()]);
  const ytReady = youtubeConfigured();
  const blobReady = blobMode() !== null;
  const mpReady = mercadoPagoConfigured();
  const mpTest = mercadoPagoTestMode();
  const [fees, sender, saleEmail] = await Promise.all([getSavedFees(), getLabelSender(), getOrderEmailSettings()]);
  const origin = String(process.env.STORE_ORIGIN_POSTAL_CODE ?? "").replace(/\D/g, "");
  const [mpCheck, mpLastError] = mpReady ? await Promise.all([checkCredentials(), getLastError()]) : [null, null];

  const meLabel = { connected: "Conectado", expired: "Autorização expirada", disconnected: "Não conectado", "no-redis": "Redis não configurado" }[me];

  return (
    <>
      <div className="admin-head"><h1>Integrações</h1></div>

      <section className="admin-card" id="aviso-venda">
        <div className="admin-integration-head">
          <h2>Aviso de venda por e-mail</h2>
          <span className={`admin-status ${saleEmail?.to ? "ok" : ""}`}>{saleEmail?.to ? "Ligado" : "Desligado"}</span>
        </div>
        <p>
          Um e-mail para você a cada venda: pedido pelo WhatsApp na hora em que é registrado; Pix e cartão quando o pagamento
          é aprovado. Enviado pela Brevo (a mesma da newsletter).
        </p>
        {query.aviso === "ok" && <p className="admin-ok">Salvo!</p>}
        {query.aviso === "teste" && <p className="admin-ok">Salvo! Mandamos um e-mail de teste. Confira a caixa de entrada (e o spam).</p>}
        {query.aviso && !["ok", "teste"].includes(query.aviso) && <p className="admin-error">{query.aviso}</p>}
        {saleEmail?.lastError && (
          <p className="admin-error">Último erro ao enviar ({new Date(saleEmail.lastErrorAt ?? "").toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}): {saleEmail.lastError}</p>
        )}
        {!process.env.BREVO_API_KEY && <p className="admin-alert">A Brevo não está configurada neste projeto (falta BREVO_API_KEY na Vercel).</p>}
        <form action={saveOrderEmailAction} className="admin-form">
          <div className="admin-grid-2">
            <label>Enviar para <small>vazio = desligado</small>
              <input name="to" type="email" defaultValue={saleEmail?.to ?? ""} placeholder="seuemail@gmail.com" />
            </label>
            <label>Remetente <small>e-mail verificado na Brevo; vazio = o mesmo</small>
              <input name="from" type="email" defaultValue={saleEmail?.from ?? ""} placeholder="o mesmo do destino" />
            </label>
          </div>
          <div className="admin-row">
            <button className="btn btn-dark" type="submit" name="test" value="1">Salvar e mandar e-mail de teste</button>
            <button className="btn btn-light" type="submit">Só salvar</button>
          </div>
        </form>
        <p className="admin-hint">
          Se o teste não chegar, confira na Brevo em <em>Remetentes, domínios e IPs dedicados → Remetentes</em> se o e-mail do
          remetente está verificado (a Brevo só envia de remetentes verificados).
        </p>
      </section>

      <section className="admin-card" id="melhor-envio">
        <div className="admin-integration-head">
          <h2>Melhor Envio</h2>
          <span className={`admin-status ${me === "connected" ? "ok" : ""}`}>{meLabel}</span>
        </div>
        <Notice value={query.melhorenvio} />
        <p>Calcula o frete no carrinho e compra as etiquetas pelo painel (na página de cada pedido). A chave da API não fica guardada no painel.</p>
        <p className="admin-hint">Conectou antes das etiquetas existirem? Clique em <strong>Reconectar</strong> uma vez para liberar as permissões de compra, impressão e rastreio.</p>
        <div className="admin-row">
          <a className="btn btn-light" href={ME_TOKENS_URL} target="_blank" rel="noopener">Abrir chaves da API no Melhor Envio ↗</a>
          <a className="btn btn-dark" href="/api/melhor-envio/authorize">{me === "connected" ? "Reconectar" : "Conectar"}</a>
        </div>
        <p className="admin-hint">A autorização vale 45 dias e é renovada automaticamente enquanto houver cotações.</p>

        <h3 className="admin-subtitle">Remetente das etiquetas</h3>
        <p className="admin-hint">Quem envia os pacotes: aparece na etiqueta e na declaração de conteúdo. Use o endereço de onde saem os envios.</p>
        {query.remetente === "ok" && <p className="admin-ok">Remetente salvo!</p>}
        {query.remetente && query.remetente !== "ok" && <p className="admin-error">{query.remetente}</p>}
        <form action={saveLabelSenderAction} className="admin-form sender-form">
          <div className="admin-grid-2">
            <label>Nome (pessoa ou empresa)<input name="name" required defaultValue={sender?.name ?? store.name} /></label>
            <label>CPF ou CNPJ<input name="document" required inputMode="numeric" defaultValue={sender?.document ?? ""} placeholder="Só números" /></label>
            <label>Telefone<input name="phone" inputMode="tel" defaultValue={sender?.phone ?? store.contact.whatsapp.replace(/^55/, "")} /></label>
            <label>E-mail<input name="email" type="email" defaultValue={sender?.email ?? ""} /></label>
          </div>
          <div className="admin-grid-3">
            <label>CEP<input name="postalCode" required inputMode="numeric" defaultValue={sender?.postalCode ?? origin} /></label>
            <label>Cidade<input name="city" required defaultValue={sender?.city ?? ""} /></label>
            <label>UF<input name="state" required maxLength={2} defaultValue={sender?.state ?? "MG"} /></label>
          </div>
          <div className="admin-grid-3">
            <label>Rua<input name="address" required defaultValue={sender?.address ?? ""} /></label>
            <label>Número<input name="number" required defaultValue={sender?.number ?? ""} /></label>
            <label>Complemento<input name="complement" defaultValue={sender?.complement ?? ""} /></label>
          </div>
          <label>Bairro<input name="district" required defaultValue={sender?.district ?? ""} /></label>
          <button className="btn btn-dark" type="submit">Salvar remetente</button>
        </form>
      </section>

      <section className="admin-card">
        <div className="admin-integration-head">
          <h2>YouTube</h2>
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
          <h2>Fotos (Vercel Blob)</h2>
          <span className={`admin-status ${blobReady ? "ok" : ""}`}>{blobReady ? "Configurado" : "Não configurado"}</span>
        </div>
        <p>Armazena as fotos dos produtos (1 GB grátis). Fotos removidas de um produto são apagadas automaticamente.</p>
        {!blobReady && <p className="admin-alert">Na Vercel: Storage → Create → Blob, e conecte ao projeto da loja.</p>}
      </section>

      <section className="admin-card" id="mercado-pago">
        <div className="admin-integration-head">
          <h2>Mercado Pago</h2>
          <span className={`admin-status ${mpReady && !mpTest ? "ok" : ""}`}>
            {!mpReady ? "Não configurado" : mpTest ? "Modo de teste" : "Ativo"}
          </span>
        </div>
        <p>
          Pix com QR Code e cartão de crédito em até {store.commerce.installments}x. Pedido pago vai sozinho para &quot;Em preparação&quot;.
        </p>
        {!mpReady ? (
          <div className="admin-alert">
            <strong>Configuração pendente.</strong> No Mercado Pago, abra <em>Suas integrações → Criar aplicação</em> e copie o{" "}
            <em>Access Token</em> em <em>Credenciais de produção</em> (ou o de teste, que começa com <code>TEST-</code>). Cadastre na Vercel como{" "}
            <code>MERCADO_PAGO_ACCESS_TOKEN</code> e faça um Redeploy. Sem ele, o checkout continua só com o WhatsApp.
          </div>
        ) : (
          <>
            {mpCheck?.ok ? (
              <p className="admin-ok">Token válido — conta: {mpCheck.account}</p>
            ) : mpCheck && (
              <p className="admin-alert"><strong>O Mercado Pago recusou o token:</strong> {mpCheck.error}</p>
            )}
            {mpLastError && (
              <p className="admin-hint">
                Último erro ao criar uma cobrança ({new Date(mpLastError.at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" })}):{" "}
                <code>{mpLastError.message}</code>
              </p>
            )}
            {mpTest && <p className="admin-alert">Usando credenciais de <strong>teste</strong>: nenhum pagamento é real. Troque pelo Access Token de produção para vender.</p>}
            <p className="admin-hint">
              Notificações: o site já avisa o Mercado Pago a cada pagamento. Se quiser configurar em <em>Suas integrações → Webhooks</em>, use{" "}
              <code>{webhookUrl()}</code> com o evento <em>Pagamentos</em> e cadastre a assinatura secreta como <code>MERCADO_PAGO_WEBHOOK_SECRET</code>.
            </p>
          </>
        )}
        <h2 style={{ marginTop: 20 }}>Taxas repassadas no preço</h2>
        <p>
          O preço cadastrado em cada produto é <strong>quanto você quer receber</strong>. O site soma a taxa do Mercado Pago:
          o preço do cartão leva a taxa do cartão e o Pix sai mais barato, só com a taxa do Pix.
          {!mpReady && " Enquanto o Mercado Pago não estiver ativo, os preços aparecem sem taxa."}
        </p>
        {query.taxas === "ok" && <p className="admin-ok">Taxas salvas. Os preços do site já foram atualizados.</p>}
        {query.taxas && query.taxas !== "ok" && <p className="admin-error">{query.taxas}</p>}
        <form action={savePaymentFeesAction}>
          <div className="admin-grid-2">
            <label>Taxa do Pix (%)
              <input name="pixPercent" inputMode="decimal" defaultValue={String(fees.pixPercent).replace(".", ",")} />
            </label>
            <label>Taxa do cartão de crédito (%)
              <input name="cardPercent" inputMode="decimal" defaultValue={String(fees.cardPercent).replace(".", ",")} />
            </label>
          </div>
          <p className="admin-hint">
            Exemplo com essas taxas: para receber {money(100)}, o site mostra <strong>{money(cardPrice(100, fees))}</strong> no cartão
            e <strong>{money(pixPrice(100, fees))}</strong> no Pix.
          </p>
          <button className="btn btn-dark" type="submit">Salvar taxas</button>
        </form>
        <p className="admin-hint" style={{ marginTop: 12 }}>
          Confira as suas em <em>Mercado Pago → Seu negócio → Custos</em>. A taxa do cartão muda com o prazo de recebimento que você escolher.
          Os juros do parcelamento ficam com o cliente (ele vê na hora de pagar), a não ser que você ative parcelas sem juros na conta.
          O número de parcelas mostrado no site fica em <code>src/stores/{store.id}.ts</code> (<code>installments</code>).
        </p>
      </section>
    </>
  );
}
