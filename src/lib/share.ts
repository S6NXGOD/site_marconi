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

/** Chamada institucional fixa, no fim de toda notícia compartilhada. */
export const CHAMADA_COMPARTILHAMENTO =
  "Confira a matéria completa no maior portal de contabilidade do Piauí, " +
  "Organização Contábil Grupo Dr. Marconi Nunes.";

/**
 * O WhatsApp usa *asterisco* para negrito. Um asterisco solto no título
 * abriria uma marcação que nunca fecha e embaralharia o resto da mensagem.
 */
function semMarcacao(texto: string): string {
  return texto.replace(/[*_~`]/g, "").trim();
}

export function mensagemDaNoticia({
  title,
  summary,
  url,
}: {
  title: string;
  summary?: string | null;
  url: string;
}): string {
  const partes = [`*${semMarcacao(title)}*`];

  const resumo = summary?.trim();
  if (resumo) partes.push(semMarcacao(resumo));

  partes.push(CHAMADA_COMPARTILHAMENTO);
  // O link fica por último: é de onde o WhatsApp monta o card, que aparece
  // logo abaixo da mensagem.
  partes.push(url);

  return partes.join("\n\n");
}

/** Link que abre o WhatsApp já com a mensagem escrita (app no celular, Web no desktop). */
export function linkWhatsApp(mensagem: string): string {
  return `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
}
