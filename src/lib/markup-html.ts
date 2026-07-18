import { toEmbedUrl } from "./embed";
import { sanitizarConteudo } from "./sanitize";

/**
 * Converte a marcação simples (a que a raspagem gera e a que as notícias
 * antigas guardam) em HTML — o formato que o editor do painel e a página
 * passam a usar.
 *
 *   parágrafo, com `[texto](url)`   → <p> … <a> … </p>
 *   `## Subtítulo`                  → <h2>
 *   `![alt](url)`                   → <figure><img></figure>
 *   `@video(url)`                   → <iframe> de embed
 *   `- item`                        → <ul><li>
 *
 * A saída passa pela sanitização: mesmo vindo de marcação "nossa", os textos e
 * URLs vêm de raspagem, então nada entra sem allowlist.
 */

const RE_IMG = /^!\[([^\]]*)\]\((\S+)\)$/;
const RE_VIDEO = /^@video\((\S+)\)$/;
const RE_LINK = /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g;

function escapar(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Escapa o texto e transforma `[texto](url)` em <a>. */
function inline(texto: string): string {
  let saida = "";
  let ultimo = 0;
  let m: RegExpExecArray | null;
  RE_LINK.lastIndex = 0;
  while ((m = RE_LINK.exec(texto)) !== null) {
    saida += escapar(texto.slice(ultimo, m.index));
    saida += `<a href="${escapar(m[2])}">${escapar(m[1])}</a>`;
    ultimo = m.index + m[0].length;
  }
  saida += escapar(texto.slice(ultimo));
  return saida;
}

export function markupParaHtml(markup: string): string {
  const blocos = markup
    .split(/\r?\n\s*\r?\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  const html = blocos
    .map((b) => {
      const img = RE_IMG.exec(b);
      if (img) {
        const alt = escapar(img[1]);
        const legenda = img[1] ? `<figcaption>${alt}</figcaption>` : "";
        return `<figure><img src="${escapar(img[2])}" alt="${alt}">${legenda}</figure>`;
      }

      const video = RE_VIDEO.exec(b);
      if (video) {
        const embed = toEmbedUrl(video[1]);
        return embed
          ? `<iframe src="${escapar(embed)}" allowfullscreen></iframe>`
          : `<p>${inline(video[1])}</p>`;
      }

      if (b.startsWith("## ")) return `<h2>${inline(b.slice(3).trim())}</h2>`;

      const linhas = b.split(/\r?\n/);
      if (linhas.every((l) => /^[-*]\s+/.test(l.trim()))) {
        const itens = linhas
          .map((l) => `<li>${inline(l.trim().replace(/^[-*]\s+/, ""))}</li>`)
          .join("");
        return `<ul>${itens}</ul>`;
      }

      // Quebra simples dentro do parágrafo vira <br>.
      return `<p>${linhas.map((l) => inline(l)).join("<br>")}</p>`;
    })
    .join("\n")
    // Itens de lista às vezes vêm em blocos separados (viram <ul> de um item
    // cada). Junta listas coladas numa só.
    .replace(/<\/ul>\s*<ul>/g, "")
    .replace(/<\/ol>\s*<ol>/g, "");

  return sanitizarConteudo(html);
}

/** O conteúdo já parece HTML? (para não reconverter o que já foi migrado) */
export function pareceHtml(texto: string): boolean {
  return /<(p|h2|h3|h4|ul|ol|li|figure|img|iframe|blockquote|strong|em)\b/i.test(texto);
}
