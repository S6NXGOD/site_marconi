// Service worker do site público (escopo "/").
//
// Existe para tornar o portal instalável como aplicativo (desktop e celular) e
// para receber notificações push (novas notícias e prazos).
// NÃO faz cache de conteúdo de propósito: o portal publica notícias e alertas,
// e servir uma versão velha do cache seria pior do que exigir conexão.
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  // Repassa direto para a rede — o handler existe porque a instalação exige um.
  event.respondWith(fetch(event.request));
});

// ——— Notificações push ———

// Chega um aviso do servidor (nova notícia / novo prazo): mostra a notificação.
self.addEventListener("push", (event) => {
  let dados = {};
  try {
    dados = event.data ? event.data.json() : {};
  } catch (e) {
    dados = {};
  }

  const titulo = dados.title || "Grupo Dr. Marconi Nunes";
  const opcoes = {
    body: dados.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: dados.tag,
    // Reexibe mesmo que já exista uma com a mesma tag.
    renotify: Boolean(dados.tag),
    data: { url: dados.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(titulo, opcoes));
});

// Clique na notificação: foca uma aba já aberta no endereço ou abre uma nova.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destino = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientes) => {
        for (const c of clientes) {
          if (c.url === destino && "focus" in c) return c.focus();
        }
        return self.clients.openWindow(destino);
      })
  );
});
