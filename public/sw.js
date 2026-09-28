/*
  Service worker do painel: mostra a notificação de pedido novo mesmo com o
  site fechado e abre o pedido ao tocar nela.
*/
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));

self.addEventListener("push", event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { title: "Pedido novo", body: event.data && event.data.text() }; }
  event.waitUntil(self.registration.showNotification(data.title || "Pedido novo", {
    body: data.body || "",
    icon: data.icon,
    badge: data.icon,
    tag: data.tag,
    renotify: true,
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: { url: data.url || "/admin/pedidos" }
  }));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url = new URL(event.notification.data && event.notification.data.url || "/admin/pedidos", self.location.origin).href;
  event.waitUntil((async () => {
    const tabs = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const open = tabs.find(t => t.url.startsWith(self.location.origin + "/admin"));
    if (open) { await open.focus(); return open.navigate(url); }
    return self.clients.openWindow(url);
  })());
});
