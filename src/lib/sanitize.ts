import sanitizeHtml from "sanitize-html";

/**
 * Limpa o HTML do corpo da notícia antes de gravar E antes de exibir.
 *
 * O conteúdo vem de dois lugares onde não dá para confiar no HTML: o editor do
 * painel (o que a pessoa colar de outro site pode trazer script/style) e a
 * importação por raspagem (HTML de terceiros). Sem uma allowlist rígida,
 * qualquer um dos dois seria porta aberta para XSS.
 *
 * A regra é simples: só passa o que é conteúdo de texto — parágrafo, título,
 * ênfase, lista, citação, link, imagem e o embed de vídeo do YouTube/Vimeo.
 * Tudo mais (script, style, on*, iframe de outro host, javascript:) é cortado.
 */
export function sanitizarConteudo(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "h2", "h3", "h4",
      "strong", "b", "em", "i", "u", "s",
      "ul", "ol", "li", "blockquote",
      "a", "img", "figure", "figcaption",
      "iframe", // só de vídeo — restrito por allowedIframeHostnames
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt"],
      iframe: ["src", "width", "height", "allow", "allowfullscreen", "frameborder"],
    },
    // Só http(s) em href/src. Bloqueia javascript:, data:, etc.
    allowedSchemes: ["http", "https"],
    allowedSchemesByTag: { img: ["http", "https"] },
    // Embed de vídeo só destes hosts — nada de iframe apontando para outro lugar.
    allowedIframeHostnames: [
      "www.youtube.com", "youtube.com", "www.youtube-nocookie.com",
      "player.vimeo.com",
    ],
    transformTags: {
      // Todo link externo abre em nova aba, sem passar autoridade (nofollow) e
      // sem vazar o referrer/janela (noopener).
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          target: "_blank",
          rel: "noopener noreferrer nofollow",
        },
      }),
    },
    // <img>/<br> sem fechamento não podem virar tag aberta engolindo o resto.
    selfClosing: ["img", "br"],
    // Comentário HTML não é conteúdo e pode esconder payload.
    allowedClasses: {},
    disallowedTagsMode: "discard",
  }).trim();
}

/** Texto puro a partir do HTML — para resumo, description e preview do WhatsApp. */
export function htmlParaTexto(html: string): string {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    // sanitize-html devolve entidades (&amp;); desfaz as comuns para o texto.
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
