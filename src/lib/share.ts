/**
 * Texto que acompanha a notícia ao ser compartilhada.
 *
 * Vale separar duas coisas que se somam no WhatsApp:
 *
 *  - O CARD (imagem, título e descrição) é montado pelo próprio WhatsApp a
 *    partir das meta tags OpenGraph da página. Nada aqui interfere nele.
 *  - A MENSAGEM é o texto que vai junto do link. É só isso que o site
 *    consegue preencher — e é o que este módulo monta.
 *
 * O card corta a descrição em duas linhas, então repetir o resumo na mensagem
 * não é redundância: é o que garante que ele seja lido por inteiro.
 */

/**
 * Chamada para o portal, em NEGRITO (o *asterisco* é o negrito do WhatsApp).
 * É o convite para ler o resto — vem logo antes do link.
 */
export const CHAMADA_COMPARTILHAMENTO =
  "*Confira a matéria completa no maior portal de contabilidade do Piauí — " +
  "Grupo Dr. Marconi Nunes:*";

/**
 * Tira a formatação do WhatsApp de um trecho que vai DENTRO de outra marcação.
 * Um asterisco solto no título abriria um negrito que nunca fecha e
 * embaralharia o resto da mensagem.
 */
function semFormatacao(texto: string): string {
  return texto.replace(/[*_~`]/g, "").trim();
}

/**
 * Monta a mensagem que acompanha o link no WhatsApp:
 *
 *   *Título*
 *   Resumo completo (uma frase inteira, nunca cortada no meio).
 *   *Confira a matéria completa no portal:*
 *   link
 *
 * O resumo já chega completo de `resumoExibicao`; aqui só se garante que ele
 * não quebre a formatação. O card (imagem + descrição) é montado pelo próprio
 * WhatsApp a partir do link — por isso ele fica por último.
 */
export function mensagemDaNoticia({
  title,
  summary,
  url,
}: {
  title: string;
  summary?: string | null;
  url: string;
}): string {
  const partes = [`*${semFormatacao(title)}*`];

  const resumo = summary?.trim();
  if (resumo) partes.push(semFormatacao(resumo));

  partes.push(CHAMADA_COMPARTILHAMENTO);
  partes.push(url);

  return partes.join("\n\n");
}

/** Link que abre o WhatsApp já com a mensagem escrita (app no celular, Web no desktop). */
export function linkWhatsApp(mensagem: string): string {
  return `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
}
