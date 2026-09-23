const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const savedCheckout = JSON.parse(localStorage.getItem("faseTeenCheckout") || "null") || {};
let state = {
  category: "Todos",
  search: "",
  sort: "featured",
  deliveryMode: savedCheckout.deliveryMode || "delivery",
  cep: savedCheckout.cep || "",
  address: savedCheckout.address || null,
  shippingOptions: [],
  selectedShipping: null,
  cart: JSON.parse(localStorage.getItem("faseTeenCart") || "[]")
};

const money = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const cleanCep = (v) => String(v || "").replace(/\D/g, "").slice(0, 8);
const formatCep = (v) => { const c = cleanCep(v); return c.length > 5 ? `${c.slice(0, 5)}-${c.slice(5)}` : c; };
const persist = () => localStorage.setItem("faseTeenCart", JSON.stringify(state.cart));
const persistCheckout = () => localStorage.setItem("faseTeenCheckout", JSON.stringify({ deliveryMode: state.deliveryMode, cep: state.cep, address: state.address }));
const productById = (id) => products.find(p => p.id === id);

// --- Mídia do produto (imagens + vídeo) ---
function mediaFor(p) {
  if (Array.isArray(p.media) && p.media.length) return p.media;
  return p.image ? [{ type: "image", src: p.image }] : [];
}
function mainImage(p) {
  const m = mediaFor(p).find(x => x.type !== "video");
  return m ? m.src : (p.image || "");
}
function mediaSlideHtml(m, alt) {
  return m.type === "video"
    ? `<div class="media-slide"><video src="${m.src}" muted loop playsinline preload="metadata" controls></video></div>`
    : `<div class="media-slide"><img src="${m.src}" alt="${alt}" loading="lazy"></div>`;
}
function mediaCarouselHtml(p, extraClass, innerExtra) {
  const media = mediaFor(p);
  const slides = media.map(m => mediaSlideHtml(m, p.name)).join("");
  const multi = media.length > 1;
  const arrows = multi ? `<button class="media-nav prev" data-nav="-1" type="button" aria-label="Imagem anterior">‹</button><button class="media-nav next" data-nav="1" type="button" aria-label="Próxima imagem">›</button>` : "";
  const dots = multi ? `<div class="media-dots">${media.map((_, i) => `<span class="dot ${i === 0 ? "active" : ""}" data-dot="${i}"></span>`).join("")}</div>` : "";
  return `<div class="product-image-wrap${extraClass ? " " + extraClass : ""}" data-count="${media.length}"><div class="media-track">${slides}</div>${arrows}${dots}${innerExtra || ""}</div>`;
}
function bindMediaCarousels(scope) {
  const root = scope || document;
  [...root.querySelectorAll(".product-image-wrap")].forEach(wrap => {
    const track = wrap.querySelector(".media-track");
    const slides = [...wrap.querySelectorAll(".media-slide")];
    const dots = [...wrap.querySelectorAll(".dot")];
    const count = slides.length;
    if (!count) return;
    wrap.dataset.index = wrap.dataset.index || "0";
    const setIndex = (i) => {
      const idx = ((i % count) + count) % count;
      wrap.dataset.index = idx;
      track.style.transform = `translateX(-${idx * 100}%)`;
      dots.forEach((d, di) => d.classList.toggle("active", di === idx));
      slides.forEach((s, si) => { const v = s.querySelector("video"); if (v && si !== idx) v.pause(); });
    };
    wrap.querySelectorAll(".media-nav").forEach(btn => {
      btn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); setIndex(Number(wrap.dataset.index) + Number(btn.dataset.nav)); };
    });
    dots.forEach((d, di) => { d.onclick = (e) => { e.preventDefault(); e.stopPropagation(); setIndex(di); }; });
  });
}

function renderCategories() {
  const cats = ["Todos", ...new Set(products.map(p => p.category))];
  $("#categoryChips").innerHTML = cats.map(c => `<button class="chip ${state.category === c ? "active" : ""}" data-category="${c}">${c}</button>`).join("");
  $$("#categoryChips .chip").forEach(b => b.onclick = () => { state.category = b.dataset.category; renderCategories(); renderProducts(); });
}

function filtered() {
  let r = [...products];
  if (state.category !== "Todos") r = r.filter(p => p.category === state.category);
  if (state.search.trim()) {
    const q = state.search.toLowerCase();
    r = r.filter(p => `${p.name} ${p.category} ${p.colors.join(" ")}`.toLowerCase().includes(q));
  }
  if (state.sort === "price-low") r.sort((a, b) => a.price - b.price);
  if (state.sort === "price-high") r.sort((a, b) => b.price - a.price);
  if (state.sort === "name") r.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  if (state.sort === "featured") r.sort((a, b) => Number(b.featured) - Number(a.featured));
  return r;
}

function card(p) {
  const inst = (p.price / 3).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const overlay = `${p.badge ? `<span class="badge">${p.badge}</span>` : ""}<button class="quick-view" data-id="${p.id}">Ver produto</button>`;
  return `<article class="product-card">${mediaCarouselHtml(p, "", overlay)}<div class="product-info"><div class="product-category">${p.category}</div><h3>${p.name}</h3>${p.reference ? `<div class="product-ref">Ref.: ${p.reference}</div>` : ""}<div class="price-row"><span class="price">${money(p.price)}</span>${p.oldPrice ? `<span class="old-price">${money(p.oldPrice)}</span>` : ""}</div><div class="installment">ou 3x de ${inst}*</div></div></article>`;
}

function renderProducts() {
  const list = filtered();
  $("#productGrid").innerHTML = list.map(card).join("");
  $("#featuredGrid").innerHTML = products.filter(p => p.featured).slice(0, 4).map(card).join("");
  $("#emptyState").classList.toggle("hidden", list.length !== 0);
  bindQuickViews();
  bindMediaCarousels();
}

function bindQuickViews() {
  $$(".quick-view").forEach(b => b.onclick = () => openProductModal(Number(b.dataset.id)));
}

function openProductModal(id) {
  const p = productById(id);
  if (!p) return;
  $("#modalContent").innerHTML = `<div class="quick-product">${mediaCarouselHtml(p, "modal-media")}<div class="quick-info"><div class="product-category">${p.category}</div><h2>${p.name}</h2>${p.reference ? `<div class="product-ref">Ref.: ${p.reference}</div>` : ""}<div class="price-row"><span class="price">${money(p.price)}</span>${p.oldPrice ? `<span class="old-price">${money(p.oldPrice)}</span>` : ""}</div><p class="quick-desc">${p.description}</p>${p.composition ? `<div class="option-row"><span>COMPOSIÇÃO / DETALHES</span><p class="quick-composition">${p.composition}</p></div>` : ""}<div class="option-row"><span>TAMANHO</span><div class="option-chips" id="sizeOptions">${p.sizes.map((s, i) => `<button class="option-chip ${i === 0 ? "active" : ""}" data-size="${s}">${s}</button>`).join("")}</div></div><div class="option-row"><span>COR</span><div class="option-chips" id="colorOptions">${p.colors.map((c, i) => `<button class="option-chip ${i === 0 ? "active" : ""}" data-color="${c}">${c}</button>`).join("")}</div></div><button class="btn btn-dark quick-buy" id="addToCartModal">Adicionar ao carrinho</button></div></div>`;
  $("#productModal").classList.remove("hidden");
  document.body.style.overflow = "hidden";
  bindMediaCarousels($("#modalContent"));
  $$("#sizeOptions .option-chip").forEach(b => b.onclick = () => { $$("#sizeOptions .option-chip").forEach(x => x.classList.remove("active")); b.classList.add("active"); });
  $$("#colorOptions .option-chip").forEach(b => b.onclick = () => { $$("#colorOptions .option-chip").forEach(x => x.classList.remove("active")); b.classList.add("active"); });
  $("#addToCartModal").onclick = () => { addToCart({ id: p.id, size: $("#sizeOptions .active")?.dataset.size || p.sizes[0] || "", color: $("#colorOptions .active")?.dataset.color || p.colors[0] || "", qty: 1 }); closeProductModal(); openCart(); };
}

function closeProductModal() { $("#productModal").classList.add("hidden"); document.body.style.overflow = ""; }

function addToCart(item) {
  const f = state.cart.find(x => x.id === item.id && x.size === item.size && x.color === item.color);
  if (f) f.qty += item.qty; else state.cart.push(item);
  state.selectedShipping = null;
  state.shippingOptions = [];
  persist();
  renderCart();
}

function detailed() { return state.cart.map(i => ({ ...i, product: productById(i.id) })).filter(x => x.product); }
function subtotal() { return detailed().reduce((s, x) => s + x.product.price * x.qty, 0); }
function freight() { return state.deliveryMode === "pickup" ? 0 : (state.selectedShipping ? Number(state.selectedShipping.price) : null); }
function total() { return subtotal() + (freight() ?? 0); }

function renderShipping() {
  const opts = state.shippingOptions || [];
  $("#shippingOptions").innerHTML = opts.map((o, i) => `<button class="shipping-option ${state.selectedShipping?.id === o.id ? "selected" : ""}" data-shipping-index="${i}" type="button"><div><strong>${o.company}${o.service ? ` • ${o.service}` : ""}</strong><small>${o.deliveryTime ? `Prazo estimado: ${o.deliveryTime} dias úteis` : "Prazo não informado"}</small></div><span class="shipping-price">${money(o.price)}</span></button>`).join("");
  $$("#shippingOptions .shipping-option").forEach(b => b.onclick = () => { state.selectedShipping = opts[Number(b.dataset.shippingIndex)]; renderShipping(); renderTotals(); });
}

function renderMode() {
  const delivery = state.deliveryMode === "delivery";
  $("#deliveryChoice").classList.toggle("active", delivery);
  $("#pickupChoice").classList.toggle("active", !delivery);
  $("#deliveryArea").classList.toggle("hidden", !delivery);
  if (!delivery) {
    state.selectedShipping = null;
    state.shippingOptions = [];
    $("#shippingOptions").innerHTML = "";
    $("#shippingStatus").textContent = "Frete R$ 0,00 para retirada na loja.";
  } else if (!state.shippingOptions.length) {
    $("#shippingStatus").textContent = state.address ? `CEP confirmado: ${formatCep(state.cep)}.` : "";
  }
  renderTotals();
}

function renderTotals() {
  $("#cartSubtotal").textContent = money(subtotal());
  $("#cartFreight").textContent = state.deliveryMode === "pickup" ? money(0) : (state.selectedShipping ? money(state.selectedShipping.price) : "A calcular");
  $("#cartTotal").textContent = money(total());
}

function renderCart() {
  const items = detailed();
  $("#cartCount").textContent = state.cart.reduce((s, x) => s + x.qty, 0);
  $("#cartItems").innerHTML = items.map(x => `<div class="cart-item"><img src="${mainImage(x.product)}" alt="${x.product.name}"><div><h4>${x.product.name}</h4><small>Tamanho: ${x.size || "-"} • Cor: ${x.color || "-"}</small><div class="cart-item-price">${money(x.product.price)}</div><div class="qty"><button data-minus="${x.id}" data-size="${x.size}" data-color="${x.color}" type="button">−</button><strong>${x.qty}</strong><button data-plus="${x.id}" data-size="${x.size}" data-color="${x.color}" type="button">+</button></div><button class="remove-btn" data-remove="${x.id}" data-size="${x.size}" data-color="${x.color}" type="button">Remover</button></div></div>`).join("");
  $("#cartEmpty").classList.toggle("hidden", items.length !== 0);
  $(".cart-footer").classList.toggle("hidden", items.length === 0);
  if (items.length) {
    $("#cepInput").value = formatCep(state.cep);
    renderMode();
    renderShipping();
    renderTotals();
  }
  $$("#cartItems [data-minus]").forEach(b => b.onclick = () => changeQty(Number(b.dataset.minus), b.dataset.size, b.dataset.color, -1));
  $$("#cartItems [data-plus]").forEach(b => b.onclick = () => changeQty(Number(b.dataset.plus), b.dataset.size, b.dataset.color, 1));
  $$("#cartItems [data-remove]").forEach(b => b.onclick = () => removeItem(Number(b.dataset.remove), b.dataset.size, b.dataset.color));
  if ($("#deliveryChoice")) $("#deliveryChoice").onclick = () => { state.deliveryMode = "delivery"; persistCheckout(); renderMode(); };
  if ($("#pickupChoice")) $("#pickupChoice").onclick = () => { state.deliveryMode = "pickup"; persistCheckout(); renderMode(); };
}

function changeQty(id, size, color, delta) {
  const i = state.cart.find(x => x.id === id && x.size === size && x.color === color);
  if (!i) return;
  i.qty += delta;
  if (i.qty <= 0) state.cart = state.cart.filter(x => !(x.id === id && x.size === size && x.color === color));
  state.selectedShipping = null;
  state.shippingOptions = [];
  persist();
  renderCart();
}

function removeItem(id, size, color) {
  state.cart = state.cart.filter(x => !(x.id === id && x.size === size && x.color === color));
  state.selectedShipping = null;
  state.shippingOptions = [];
  persist();
  renderCart();
}

async function lookupCep(cep, { showStatus = true } = {}) {
  const clean = cleanCep(cep);
  if (clean.length !== 8) throw new Error("Digite um CEP válido com 8 números.");
  const response = await fetch(`https://viacep.com.br/ws/${clean}/json/`, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("Não foi possível consultar o CEP agora. Tente novamente.");
  const data = await response.json();
  if (data.erro) throw new Error("CEP não encontrado. Confira o CEP informado.");
  const address = {
    cep: clean,
    address: String(data.logradouro || "").trim(),
    complement: String(data.complemento || "").trim(),
    district: String(data.bairro || "").trim(),
    city: String(data.localidade || "").trim(),
    state: String(data.uf || "").trim().toUpperCase()
  };
  state.cep = clean;
  state.address = address;
  state.selectedShipping = null;
  state.shippingOptions = [];
  persistCheckout();
  if (showStatus) $("#shippingStatus").textContent = `CEP encontrado: ${address.city}/${address.state}. Agora calcule o frete.`;
  return address;
}

function fillCheckoutAddress(address) {
  $("#checkoutAddress").value = address?.address || "";
  $("#checkoutDistrict").value = address?.district || "";
  $("#checkoutCity").value = address?.city || "";
  $("#checkoutState").value = address?.state || "";
  if (address?.complement && !$("#checkoutComplement").value) $("#checkoutComplement").value = address.complement;
}

async function handleCheckoutCepLookup() {
  const input = $("#checkoutCep");
  const note = $("#checkoutAddressNote");
  input.value = formatCep(input.value);
  note.textContent = "Consultando CEP...";
  try {
    const address = await lookupCep(input.value, { showStatus: false });
    fillCheckoutAddress(address);
    note.textContent = `Endereço encontrado: ${address.city}/${address.state}. Confira e complete número/complemento.`;
  } catch (e) {
    state.address = null;
    persistCheckout();
    ["checkoutAddress", "checkoutDistrict", "checkoutCity", "checkoutState"].forEach(id => { if ($(`#${id}`)) $(`#${id}`).value = ""; });
    note.textContent = e.message;
  }
}

async function calculateFreight() {
  if (!state.cart.length) return;
  const cep = cleanCep($("#cepInput").value);
  if (cep.length !== 8) { $("#shippingStatus").textContent = "Digite um CEP válido com 8 números."; return; }
  $("#calculateFreightBtn").disabled = true;
  $("#calculateFreightBtn").textContent = "Validando...";
  $("#shippingStatus").textContent = "Validando o CEP...";
  $("#shippingOptions").innerHTML = "";
  state.selectedShipping = null;
  try {
    await lookupCep(cep);
    $("#calculateFreightBtn").textContent = "Calculando...";
    $("#shippingStatus").textContent = "Consultando as opções de envio...";
    const r = await fetch("/api/frete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postalCode: cep, items: state.cart.map(i => ({ id: i.id, quantity: i.qty })) }) });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || "Não foi possível calcular o frete.");
    state.shippingOptions = Array.isArray(data.options) ? data.options : [];
    if (!state.shippingOptions.length) $("#shippingStatus").textContent = "CEP válido, mas nenhuma opção de envio foi encontrada.";
    else { $("#shippingStatus").textContent = "Escolha uma opção de envio:"; renderShipping(); }
  } catch (e) {
    $("#shippingStatus").textContent = e.message || "Erro ao calcular o frete.";
  } finally {
    $("#calculateFreightBtn").disabled = false;
    $("#calculateFreightBtn").textContent = "Calcular";
  }
  renderTotals();
}

function openCart() { $("#cartDrawer").classList.add("open"); $("#overlay").classList.remove("hidden"); }
function closeCart() { $("#cartDrawer").classList.remove("open"); $("#overlay").classList.add("hidden"); }
function closeCheckout() { $("#checkoutModal").classList.add("hidden"); document.body.style.overflow = ""; }

function setCheckoutRequired(delivery) {
  ["checkoutCep", "checkoutAddress", "checkoutNumber", "checkoutDistrict", "checkoutCity", "checkoutState"].forEach(id => { if ($(`#${id}`)) $(`#${id}`).required = delivery; });
}

function checkout() {
  if (!state.cart.length) return;
  if (state.deliveryMode === "delivery" && !state.selectedShipping) { $("#shippingStatus").textContent = "Calcule e escolha o frete antes de finalizar."; $("#cepInput").focus(); return; }
  const form = $("#checkoutForm");
  form.reset();
  $("#checkoutCep").value = state.cep ? formatCep(state.cep) : "";
  $("#checkoutAddressNote").textContent = "";
  $("#checkoutNote").textContent = "";
  if (state.deliveryMode === "delivery" && state.address) fillCheckoutAddress(state.address);
  setCheckoutRequired(state.deliveryMode === "delivery");
  $("#checkoutModal").classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function whatsappMessage(data) {
  const delivery = state.deliveryMode === "pickup"
    ? "Retirada na loja física — frete R$ 0,00"
    : `${state.selectedShipping.company}${state.selectedShipping.service ? ` • ${state.selectedShipping.service}` : ""} — ${money(state.selectedShipping.price)}${state.selectedShipping.deliveryTime ? ` — prazo estimado: ${state.selectedShipping.deliveryTime} dias úteis` : ""}`;
  const addressLines = state.deliveryMode === "pickup" ? [] : [
    `*Endereço:* ${data.address}, ${data.number}`,
    `*Complemento:* ${data.complement || "Não informado"}`,
    `*Bairro:* ${data.district}`,
    `*Cidade:* ${data.city}`,
    `*Estado:* ${String(data.state || "").toUpperCase()}`,
    `*CEP:* ${formatCep(data.cep)}`
  ];
  return encodeURIComponent([
    `Olá! Quero fazer um pedido na *${storeConfig.brand}*.`, "",
    "*Produtos:*", ...detailed().map(x => `• ${x.product.name} | Tam. ${x.size} | Cor: ${x.color} | Qtd: ${x.qty} | ${money(x.product.price * x.qty)}`), "",
    `*Subtotal:* ${money(subtotal())}`, `*Entrega:* ${delivery}`, `*TOTAL:* ${money(total())}`, "",
    `*Nome:* ${data.name}`, `*WhatsApp:* ${data.phone}`, `*E-mail:* ${data.email}`,
    ...addressLines,
    `*Observações:* ${data.notes || "Não informado"}`, "", "Aguardo confirmação de estoque, pagamento e envio."
  ].join("\n"));
}

function init() {
  $("#currentYear").textContent = new Date().getFullYear();
  $("#footerWhatsapp").href = `https://wa.me/${storeConfig.whatsapp}`;
  $("#floatingWhatsapp").href = `https://wa.me/${storeConfig.whatsapp}?text=${encodeURIComponent("Olá! Vim pelo site da Fase Teen e gostaria de atendimento.")}`;
  $("#footerInstagram").href = storeConfig.instagram;
  $("#footerInstagram").textContent = storeConfig.instagramHandle;
  renderCategories(); renderProducts(); renderCart();
  $("#sortSelect").onchange = e => { state.sort = e.target.value; renderProducts(); };
  $("#searchBtn").onclick = () => { $("#searchWrap").classList.toggle("show"); if ($("#searchWrap").classList.contains("show")) $("#searchInput").focus(); };
  $("#searchInput").oninput = e => { state.search = e.target.value; renderProducts(); };
  $("#cartBtn").onclick = openCart; $("#closeCart").onclick = closeCart; $("#overlay").onclick = closeCart; $("#goShoppingBtn").onclick = closeCart;
  $("#modalClose").onclick = closeProductModal; $("#productModal").onclick = e => { if (e.target === $("#productModal")) closeProductModal(); };
  $("#calculateFreightBtn").onclick = calculateFreight;
  $("#cepInput").oninput = e => { state.cep = cleanCep(e.target.value); e.target.value = formatCep(state.cep); state.address = null; state.shippingOptions = []; state.selectedShipping = null; persistCheckout(); };
  $("#cepInput").onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); calculateFreight(); } };
  $("#checkoutBtn").onclick = checkout; $("#checkoutClose").onclick = closeCheckout;
  $("#checkoutModal").onclick = e => { if (e.target === $("#checkoutModal")) closeCheckout(); };
  $("#checkoutCep").oninput = e => { e.target.value = formatCep(e.target.value); };
  $("#checkoutCep").onblur = () => { if (cleanCep($("#checkoutCep").value).length === 8) handleCheckoutCepLookup(); };
  $("#checkoutCepBtn").onclick = handleCheckoutCepLookup;
  $("#checkoutForm").onsubmit = async e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    if (state.deliveryMode === "delivery") {
      if (!state.selectedShipping) { $("#checkoutNote").textContent = "Selecione o frete antes de enviar o pedido."; closeCheckout(); openCart(); return; }
      if (!state.address || cleanCep(data.cep) !== state.address.cep) {
        $("#checkoutNote").textContent = "Consulte o CEP antes de finalizar o pedido.";
        return;
      }
    }
    if (!storeConfig.whatsapp || storeConfig.whatsapp.includes("0000")) { $("#checkoutNote").textContent = "Configure o WhatsApp em products.js antes de usar esta etapa."; return; }
    if (!data.name || !data.phone || !data.email) { $("#checkoutNote").textContent = "Preencha nome, WhatsApp e e-mail."; return; }
    window.open(`https://wa.me/${storeConfig.whatsapp}?text=${whatsappMessage(data)}`, "_blank", "noopener");
    $("#checkoutNote").textContent = "Pedido preparado no WhatsApp. Confira a mensagem antes de enviar.";
  };
  $("#newsletterForm").onsubmit = async e => {
    e.preventDefault();
    const em = $("#newsletterEmail").value.trim();
    const note = $("#newsletterNote");
    const btn = $("#newsletterForm button[type=submit]") || $("#newsletterForm").querySelector("button");
    if (btn) btn.disabled = true;
    note.textContent = "Enviando...";
    try {
      const r = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: em }) });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Não foi possível cadastrar seu e-mail agora.");
      note.textContent = `Pronto! ${em} foi cadastrado com sucesso.`;
      e.target.reset();
    } catch (err) {
      note.textContent = err.message || "Não foi possível cadastrar seu e-mail agora.";
    } finally {
      if (btn) btn.disabled = false;
    }
  };
  $("#mobileMenuBtn").onclick = () => $("#mainNav").classList.toggle("open");
  $$("#mainNav a").forEach(a => a.onclick = () => $("#mainNav").classList.remove("open"));
}

document.addEventListener("DOMContentLoaded", init);
