import { semMarcacao } from "./texto-rico";

/**
 * Texto puro a partir de HTML OU da marcação antiga.
 *
 * Regex, e não sanitize-html, de propósito: isto roda também em componentes
 * client (os cards), e sanitize-html é lib de servidor. Aqui o objetivo é só
 * texto para exibir — o React escapa o resultado, então uma tag que escape do
 * regex vira texto, nunca script.
 */
function paraTextoSimples(s: string): string {
  return semMarcacao(
    s
      .replace(/<[^>]*>/g, " ") // tags fora
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
  );
}

/**
 * Resumo curto e COMPLETO de um texto.
 *
 * O problema que resolve: antes o resumo era um corte cru nos primeiros ~200
 * caracteres, que parava no meio de uma palavra e terminava em "…". Numa
 * notícia importada, o corpo começa com o mesmo texto, então além de cortado
 * o resumo ainda repetia o começo da matéria.
 *
 * Aqui o corte respeita o fim de frase: o resumo termina num ponto, não numa
 * palavra pela metade. Só quando a primeira frase é longa demais é que sobra
 * um "…" — e ainda assim numa fronteira de palavra.
 */
export function resumoInteligente(texto: string, max = 220): string {
  const limpo = paraTextoSimples(texto).replace(/\s+/g, " ").trim();
  if (limpo.length <= max) return limpo;

  // Fim de frase = . ! ? seguido de espaço ou fim do texto. Mantém o ponto.
  const sentencas = limpo.match(/[^.!?]+[.!?]+(?=\s|$)/g);

  if (!sentencas || sentencas.length === 0) {
    // Texto sem pontuação de fim de frase: corta na palavra.
    return cortarNaPalavra(limpo, max);
  }

  let resumo = sentencas[0].trim();
  for (let i = 1; i < sentencas.length; i++) {
    const proximo = `${resumo} ${sentencas[i].trim()}`;
    if (proximo.length > max) break;
    resumo = proximo;
  }

  // A primeira frase sozinha pode passar do limite. Tolera-se um excedente
  // (uma frase inteira lê melhor que meia), mas com teto: acima dele, corta.
  const TETO = max + 140;
  return resumo.length > TETO ? cortarNaPalavra(resumo, TETO) : resumo;
}

function cortarNaPalavra(texto: string, max: number): string {
  if (texto.length <= max) return texto;
  const corte = texto.slice(0, max);
  const espaco = corte.lastIndexOf(" ");
  return `${(espaco > 0 ? corte.slice(0, espaco) : corte).replace(/[.,;:]$/, "")}…`;
}

/**
 * Resumo para EXIBIÇÃO (cards, busca, preview do WhatsApp, description).
 *
 * Usa o resumo digitado quando ele é bom; senão, deriva do corpo. "Bom" = tem
 * conteúdo e não termina em "…" — o "…" denuncia o corte cru antigo, e nesse
 * caso o corpo dá um resumo melhor do que reaproveitar o texto já mutilado.
 */
export function resumoExibicao(
  excerpt: string | null | undefined,
  content: string,
  max = 220
): string {
  const bom = excerpt?.trim() && !excerpt.trim().endsWith("…");
  return resumoInteligente(bom ? excerpt! : content, max);
}

/**
 * O resumo é só o começo do corpo?
 *
 * Serve para não repetir, no topo da matéria, um texto que o leitor vai ler de
 * novo no primeiro parágrafo. Acontece com o importado, cujo resumo sai do
 * próprio corpo; não acontece com o resumo escrito à mão, que é um chamariz
 * distinto.
 */
export function resumoRepeteCorpo(
  excerpt: string | null | undefined,
  content: string
): boolean {
  if (!excerpt) return false;

  const normal = (s: string) =>
    paraTextoSimples(s)
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/[^0-9a-zà-ú ]/gi, "")
      .trim();

  const e = normal(excerpt);
  const c = normal(content);
  if (e.length < 20) return false;

  // Compara o início do resumo com o início do corpo. 60 caracteres bastam
  // para não dar falso positivo, e o resumo pode ter sido cortado antes disso.
  const trecho = e.slice(0, Math.min(60, e.length));
  return c.startsWith(trecho);
}
