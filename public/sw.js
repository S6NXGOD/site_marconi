// Service worker mínimo do painel (/admin).
// Existe para tornar o PWA instalável; não faz cache offline de propósito:
// o painel mostra dados do banco e conteúdo velho em cache seria pior que
// uma mensagem de "sem conexão".
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => {
  // Repassa direto para a rede.
  event.respondWith(fetch(event.request));
});
