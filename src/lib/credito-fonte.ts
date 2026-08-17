/**
 * Crédito da fonte de uma notícia importada.
 *
 * O problema que resolve: nem toda fonte é um órgão público. TCE-PI e Receita
 * Federal são órgãos — "publicado pela assessoria do órgão" está certo. Já
 * Jornal Contábil, Contábeis ou IOB são VEÍCULOS de imprensa — chamá-los de
 * "órgão" é erro factual. A frase do crédito passa a se adaptar ao tipo da
 * fonte, detectado pelo domínio (sinal mais confiável) e, como reforço, pelo
 * nome. Sem campo novo no banco: deriva do `sourceUrl` que já é guardado, então
 * vale também para as notícias já cadastradas.
 */

// Domínios inequívocos de ente público brasileiro.
//  .gov.br (executivo), .tc.br (tribunais de contas — tcepi.tc.br),
//  .jus.br (judiciário), .leg.br (legislativo), .mp.br (ministério público).
const DOMINIOS_ORGAO = /\.(gov|tc|jus|leg|mp)\.br$/i;

// Reforço pelo nome, para o caso raro de órgão em domínio comum.
const NOMES_ORGAO =
  /\b(tce|tcu|tcm|receita federal|prefeitura|governo|secretaria|sefaz|minist[ée]rio|tribunal|c[âa]mara municipal|assembleia|autarquia|defensoria|fazenda estadual|sefa)\b/i;

/** A fonte é um órgão público (e não um veículo de imprensa)? */
export function fonteEhOrgao(
  sourceName?: string | null,
  sourceUrl?: string | null
): boolean {
  if (sourceUrl) {
    try {
      if (DOMINIOS_ORGAO.test(new URL(sourceUrl).hostname)) return true;
    } catch {
      /* URL inválida — cai no nome */
    }
  }
  return NOMES_ORGAO.test(sourceName ?? "");
}

/**
 * Frase de crédito, adaptada ao tipo da fonte. Vem depois de "Fonte: {nome}."
 *  - Órgão público  → creditado à assessoria do órgão.
 *  - Demais fontes  → reprodução com crédito, sem chamar de "órgão".
 */
export function creditoDaFonte(
  sourceName?: string | null,
  sourceUrl?: string | null
): string {
  return fonteEhOrgao(sourceName, sourceUrl)
    ? "Conteúdo publicado originalmente pela assessoria do órgão."
    : "Conteúdo reproduzido da fonte original, com o devido crédito.";
}
