// Gera um slug amigável a URLs a partir de um texto (remove acentos, espaços, etc.).
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos (marcas diacríticas)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // não-alfanumérico → hífen
    .replace(/^-+|-+$/g, ""); // remove hífens das pontas
}

/**
 * Palavras que não somam nada à busca. Tirá-las encurta a URL sem mudar o
 * assunto da matéria.
 *
 * A lista é de propósito curta: só artigos, preposições, contrações e
 * conjunções. Ficam de fora as negações ("não", "nem"), que inverteriam o
 * sentido do título, e as palavras de intenção ("como", "quando", "porque"),
 * que são justamente o que a pessoa digita no Google.
 *
 * Escrever já sem acento — a comparação acontece depois do `slugify`.
 */
const STOPWORDS = new Set([
  "a", "ao", "aos", "as", "o", "os",
  "um", "uma", "uns", "umas",
  "de", "da", "das", "do", "dos", "dum", "duma",
  "e", "em", "na", "nas", "no", "nos", "num", "numa",
  "por", "pelo", "pela", "pelos", "pelas", "para", "pra",
  "com", "sem", "sob", "sobre", "entre", "ate", "apos",
  "que", "se", "ou", "mas",
  "seu", "sua", "seus", "suas",
  "este", "esta", "esse", "essa", "isso", "isto",
]);

/**
 * Limite de caracteres do slug. Acima disso a URL passa a ser truncada nos
 * resultados de busca e vira aquele link quilométrico ao compartilhar.
 */
export const MAX_SLUG = 60;

/**
 * Versão enxuta do slug, usada quando ele é gerado a partir do título.
 *
 * Tira as stopwords e corta no limite — sempre em fronteira de palavra, para
 * a URL não terminar num pedaço de palavra sem sentido.
 *
 * Só vale para o slug automático: se a pessoa digitar o slug à mão, o que ela
 * escreveu é respeitado (apenas normalizado por `slugify`).
 */
export function slugOtimizado(input: string, max = MAX_SLUG): string {
  const palavras = slugify(input).split("-").filter(Boolean);
  if (!palavras.length) return "";

  // Um título feito só de stopwords ("O que é isso") ainda precisa de slug.
  const uteis = palavras.filter((p) => !STOPWORDS.has(p));
  const escolhidas = uteis.length ? uteis : palavras;

  let slug = "";
  for (const palavra of escolhidas) {
    if (!slug) {
      slug = palavra;
      continue;
    }
    if (slug.length + 1 + palavra.length > max) break;
    slug += `-${palavra}`;
  }

  // Caso raro: a primeira palavra sozinha já estoura o limite.
  return slug.length > max ? slug.slice(0, max).replace(/-+$/, "") : slug;
}
