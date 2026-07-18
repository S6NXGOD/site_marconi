import { sanitizarConteudo } from "./sanitize";
import { markupParaHtml, pareceHtml } from "./markup-html";

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
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
