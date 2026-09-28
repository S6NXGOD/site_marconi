/**
 * Coleta da Audiência — o lado do navegador. Só roda no navegador.
 *
 * Manda "pulsos" pequenos para /api/pulso (ver lá o formato). Sem cookie: a
 * origem da visita fica no sessionStorage da aba e some quando ela fecha.
 */

const ENDPOINT = "/api/pulso";
const CHAVE_ORIGEM = "pulso-origem";

/** Área do painel e login não são público — nunca medem. */
export function ehAreaInterna(path: string): boolean {
  return /^\/(admin|login)(\/|$)/.test(path);
}

/**
 * Envia um pulso. `sendBeacon` sobrevive ao fechamento da aba (é o que faz o
 * tempo de leitura chegar mesmo quando a pessoa sai); sem ele, fetch keepalive.
 */
export function enviarPulso(dados: Record<string, unknown>): void {
  const corpo = JSON.stringify(dados);
  try {
    if (navigator.sendBeacon?.(ENDPOINT, new Blob([corpo], { type: "application/json" }))) return;
  } catch {
    /* segue para o fetch */
  }
  fetch(ENDPOINT, {
    method: "POST",
    body: corpo,
    keepalive: true,
    headers: { "Content-Type": "application/json" },
  }).catch(() => {});
}

/**
 * De onde a pessoa chegou, decidido na PRIMEIRA página da aba e mantido nas
 * seguintes: quem entrou pelo WhatsApp e abriu mais três matérias trouxe
 * quatro acessos do WhatsApp, não um do WhatsApp e três "diretos".
 *
 * O `?via=` sai da barra de endereço depois de lido: se o leitor copiar o link
 * e postar em outro lugar, quem chegar por lá não entra como WhatsApp.
 */
export function origemDaSessao(): { r: string; o: string } {
  try {
    const salva = sessionStorage.getItem(CHAVE_ORIGEM);
    if (salva) return JSON.parse(salva);
  } catch {
    /* sem sessionStorage: calcula de novo */
  }

  const url = new URL(window.location.href);
  const via = url.searchParams.get("via") || url.searchParams.get("utm_source") || "";

  let ref = "";
  try {
    ref = document.referrer ? new URL(document.referrer).host : "";
  } catch {
    ref = "";
  }
  if (ref === window.location.host) ref = "";

  const origem = { r: ref, o: via };
  try {
    sessionStorage.setItem(CHAVE_ORIGEM, JSON.stringify(origem));
  } catch {
    /* segue sem guardar */
  }

  if (url.searchParams.has("via")) {
    url.searchParams.delete("via");
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
  }

  return origem;
}

/** Id da notícia aberta, marcado na página da matéria (data-pulso-noticia). */
export function noticiaDaPagina(): string | undefined {
  return (
    document.querySelector<HTMLElement>("[data-pulso-noticia]")?.dataset.pulsoNoticia || undefined
  );
}

/** Registra um clique que importa (compartilhar, chamar no WhatsApp…). */
export function registrarClique(
  tipo: "compartilhar" | "contato_whatsapp" | "cta_especialista"
): void {
  const path = window.location.pathname;
  if (ehAreaInterna(path)) return;
  enviarPulso({ t: "c", k: tipo, p: path, n: noticiaDaPagina() });
}
