import { comLinks } from "./texto-rico";
import { toEmbedUrl } from "./embed";

/**
 * Renderiza o corpo da notícia com a marcação rica:
 *   texto de parágrafo, com `[link](url)`
 *   `## Subtítulo`
 *   `![alt](url)`      → imagem
 *   `@video(url)`      → embed de vídeo
 *   `- item`           → lista
 *
 * É texto puro, renderizado por nós elemento a elemento — NUNCA
 * `dangerouslySetInnerHTML`. O conteúdo pode vir de raspagem de terceiros, e
 * interpretá-lo como HTML seria XSS. Aqui cada bloco vira um nó React seguro.
 */

type Bloco =
  | { tipo: "titulo"; texto: string }
  | { tipo: "imagem"; url: string; alt: string }
  | { tipo: "video"; url: string }
  | { tipo: "lista"; itens: string[] }
  | { tipo: "paragrafo"; texto: string };

const RE_IMG = /^!\[([^\]]*)\]\((\S+)\)$/;
const RE_VIDEO = /^@video\((\S+)\)$/;

export function parseConteudo(content: string): Bloco[] {
  // `\r?` porque o <textarea> do painel devolve CRLF (especificação do HTML).
  return content
    .split(/\r?\n\s*\r?\n/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b): Bloco => {
      const img = RE_IMG.exec(b);
      if (img) return { tipo: "imagem", url: img[2], alt: img[1] };

      const video = RE_VIDEO.exec(b);
      if (video) return { tipo: "video", url: video[1] };

      if (b.startsWith("## ")) return { tipo: "titulo", texto: b.slice(3).trim() };

      // Bloco em que TODA linha começa com "- " é uma lista.
      const linhas = b.split(/\r?\n/);
      if (linhas.every((l) => /^[-*]\s+/.test(l.trim()))) {
        return {
          tipo: "lista",
          itens: linhas.map((l) => l.trim().replace(/^[-*]\s+/, "")).filter(Boolean),
        };
      }

      return { tipo: "paragrafo", texto: b };
    });
}

export function ConteudoNoticia({ content }: { content: string }) {
  const blocos = parseConteudo(content);
  // O primeiro PARÁGRAFO ganha destaque de lide — mas só ele, e a imagem ou o
  // título que venham antes não roubam esse papel.
  let lideUsado = false;

  return (
    <div className="space-y-5">
      {blocos.map((b, i) => {
        switch (b.tipo) {
          case "titulo":
            return (
              <h2
                key={i}
                className="pt-3 font-serif text-xl font-semibold text-conplan sm:text-2xl"
              >
                {b.texto}
              </h2>
            );

          case "imagem":
            return (
              <figure key={i} className="my-2">
                {/* Imagem do corpo já veio otimizada (sharp) e é servida do
                    nosso volume; <img> comum basta e evita o next/image exigir
                    dimensões que não temos. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={b.url}
                  alt={b.alt}
                  loading="lazy"
                  className="mx-auto w-full rounded-2xl"
                />
                {b.alt && (
                  <figcaption className="mt-2 text-center text-xs text-slate-500">
                    {b.alt}
                  </figcaption>
                )}
              </figure>
            );

          case "video": {
            const embed = toEmbedUrl(b.url);
            if (embed) {
              return (
                <div
                  key={i}
                  className="relative my-2 aspect-video overflow-hidden rounded-2xl bg-slate-900"
                >
                  <iframe
                    src={embed}
                    title="Vídeo"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full"
                  />
                </div>
              );
            }
            // Sem embed conhecido: link para o vídeo, em vez de sumir com ele.
            return (
              <a
                key={i}
                href={b.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-flex items-center gap-2 text-marconi underline decoration-marconi/40 underline-offset-2 hover:decoration-marconi"
              >
                Assistir ao vídeo
              </a>
            );
          }

          case "lista":
            return (
              <ul key={i} className="ml-1 space-y-2">
                {b.itens.map((item, j) => (
                  <li
                    key={j}
                    className="relative pl-5 text-base leading-[1.85] text-slate-700 sm:text-[17px]"
                  >
                    <span className="absolute left-0 top-[0.7em] h-1.5 w-1.5 rounded-full bg-marconi" />
                    {comLinks(item, `l${i}-${j}`)}
                  </li>
                ))}
              </ul>
            );

          default: {
            const lide = !lideUsado;
            lideUsado = true;
            return (
              <p
                key={i}
                className={
                  lide
                    ? "text-lg leading-[1.8] text-conplan sm:text-xl"
                    : "text-base leading-[1.85] text-slate-700 sm:text-[17px]"
                }
              >
                {comLinks(b.texto, `p${i}`)}
              </p>
            );
          }
        }
      })}
    </div>
  );
}
