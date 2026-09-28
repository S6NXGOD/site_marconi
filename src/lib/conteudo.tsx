import { sanitizarConteudo } from "./sanitize";
import { markupParaHtml, pareceHtml } from "./markup-html";
import { isSafeUploadName } from "./uploads";

/**
 * Renderiza o corpo da notícia (HTML) na página.
 *
 * O conteúdo é sanitizado AQUI também, não só ao gravar: é a última linha de
 * defesa, e cobre notícias antigas gravadas antes da sanitização entrar. Se o
 * conteúdo ainda estiver na marcação antiga (importado antes da migração para
 * HTML), converte na hora — assim nada aparece cru enquanto a migração não
 * roda.
 *
 * `dangerouslySetInnerHTML` é seguro aqui justamente por isso: o que entra já
 * passou pela allowlist de `sanitizarConteudo`.
 */
export function ConteudoNoticia({ content }: { content: string }) {
  const html = pareceHtml(content)
    ? sanitizarConteudo(content)
    : markupParaHtml(content);

  return (
    <div
      className="conteudo-noticia"
      dangerouslySetInnerHTML={{ __html: otimizarImagensDoCorpo(html) }}
    />
  );
}

/**
 * Larguras servidas às fotos do corpo. Precisam estar entre as `deviceSizes`
 * do otimizador do Next (as padrão): qualquer outra responde erro 400.
 */
const LARGURAS = [640, 750, 828, 1080, 1200];

/** URL do otimizador de imagens do Next — o mesmo que serve as capas. */
function otimizada(caminho: string, largura: number): string {
  return `/_next/image?url=${encodeURIComponent(caminho)}&amp;w=${largura}&amp;q=75`;
}

/**
 * Fotos do corpo pelo otimizador do Next: AVIF/WebP no tamanho da tela, em
 * vez do JPEG original de até 1600 px — no celular, a foto do meio da matéria
 * pesava 3 a 4 vezes mais do que precisava.
 *
 * Só vale para as nossas (/api/uploads/…): o otimizador não abre imagem de
 * outro site, de propósito (ver next.config). As externas seguem como estão.
 * Todas ganham carregamento preguiçoso — foto do meio do texto não precisa
 * disputar banda com o topo da página.
 *
 * Roda DEPOIS da sanitização e só monta URL a partir de um nome de arquivo
 * validado por `isSafeUploadName`: nada do que vem do conteúdo entra cru.
 */
export function otimizarImagensDoCorpo(html: string): string {
  return html.replace(/<img\b([^>]*?)\s*\/?>/gi, (_tag, atributos: string) => {
    const src = /\ssrc="([^"]*)"/i.exec(atributos)?.[1] ?? "";
    const alt = /\salt="([^"]*)"/i.exec(atributos)?.[1] ?? "";
    const comum = `alt="${alt}" loading="lazy" decoding="async"`;

    const nome = /^\/api\/uploads\/([^/?#]+)$/.exec(src)?.[1];
    if (!nome || !isSafeUploadName(nome)) return `<img src="${src}" ${comum} />`;

    const caminho = `/api/uploads/${nome}`;
    const srcset = LARGURAS.map((w) => `${otimizada(caminho, w)} ${w}w`).join(", ");
    return `<img src="${otimizada(caminho, 1080)}" srcset="${srcset}" sizes="(max-width: 768px) 100vw, 768px" ${comum} />`;
  });
}
