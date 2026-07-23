// Service worker do site público (escopo "/").
//
// Existe para tornar o portal instalável como aplicativo (desktop e celular).
// NÃO faz cache de conteúdo de propósito: o portal publica notícias e alertas,
// e servir uma versão velha do cache seria pior do que exigir conexão.
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  // Repassa direto para a rede — o handler existe porque a instalação exige um.
  event.respondWith(fetch(event.request));
});
