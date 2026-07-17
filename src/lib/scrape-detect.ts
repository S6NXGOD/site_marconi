import * as cheerio from "cheerio";

/**
 * Detecção automática de seletores.
 *
 * Uma página de listagem de notícias é sempre a mesma coisa: um bloco que se
 * repete, cada um com um título que é link, e quase sempre imagem e data.
 * Isto acha esse padrão sozinho, para a pessoa não precisar abrir o inspetor
 * do navegador e caçar classe CSS.
 *
 * Não é mágica nem acerta 100%: por isso o resultado preenche o formulário e
 * passa pelo "Testar seletores" antes de salvar. É um bom chute, não um
 * veredito.
 */

export type SeletoresDetectados = {
  itemSelector: string;
  titleSelector: string;
  linkSelector: string;
  dateSelector: string;
  imageSelector: string;
  excerptSelector: string;
  contentSelector: string;
  /** quantos itens o seletor encontrou — sinal de que deu certo */
  quantidade: number;
};

/** Nome da tag de um nó do cheerio (que tipa como AnyNode). */
function tagDe(node: any): string {
  return (node?.tagName || node?.name || "").toLowerCase();
}

/** Classe que parece pertencer a UM item (sufixo numérico, estado is-/has-). */
function ehClasseInstavel(c: string): boolean {
  return /\d{2,}$/.test(c) || /^(is|has)-/.test(c);
}

function classesEstaveis(el: cheerio.Cheerio<any>): string[] {
  return (el.attr("class") || "")
    .split(/\s+/)
    .filter((c) => c && !ehClasseInstavel(c));
}

const RE_DATA = /\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}\s+de\s+[a-zà-ú]+/i;

/**
 * Detecta os seletores da LISTAGEM a partir do HTML da página.
 * Devolve null quando não reconhece um padrão de notícias.
 */
export function detectarListagem(
  html: string,
  baseUrl: string
): SeletoresDetectados | null {
  const $ = cheerio.load(html);
  let host: string;
  try {
    host = new URL(baseUrl).hostname;
  } catch {
    return null;
  }

  // Manchete = link de título: <a href> do mesmo site, texto com corpo, dentro
  // de um heading. O heading é o que separa notícia de item de menu.
  const ehManchete = (a: any): boolean => {
    const $a = $(a);
    if ($a.text().trim().length < 20) return false;
    try {
      return new URL($a.attr("href") || "", baseUrl).hostname === host;
    } catch {
      return false;
    }
  };
  const contaManchetes = (el: any): number =>
    $(el)
      .find("h1 a[href],h2 a[href],h3 a[href],h4 a[href]")
      .filter((_, a) => ehManchete(a)).length;

  const manchetes = $("h1 a[href],h2 a[href],h3 a[href],h4 a[href]")
    .filter((_, a) => ehManchete(a))
    .toArray();
  if (manchetes.length < 3) return null;

  // Card = ancestral mais externo que ainda contém UMA só manchete. Subir além
  // disso entraria na lista, que tem várias.
  const cards: any[] = [];
  for (const a of manchetes) {
    let el = $(a).closest("h1,h2,h3,h4");
    while (
      el.parent().length &&
      !el.parent().is("body,html") &&
      contaManchetes(el.parent().get(0)) === 1
    ) {
      el = el.parent();
    }
    const node = el.get(0);
    if (node) cards.push(node);
  }
  if (cards.length < 3) return null;

  // Tag e classes que se repetem entre os cards — as instáveis já saíram.
  const tagFreq: Record<string, number> = {};
  const clsFreq: Record<string, number> = {};
  for (const el of cards) {
    const t = tagDe(el);
    tagFreq[t] = (tagFreq[t] || 0) + 1;
    for (const c of classesEstaveis($(el))) clsFreq[c] = (clsFreq[c] || 0) + 1;
  }
  const tag = Object.entries(tagFreq).sort((a, b) => b[1] - a[1])[0][0];
  const limiar = cards.length * 0.6;
  const classes = Object.entries(clsFreq)
    .filter(([, n]) => n >= limiar)
    .map(([c]) => c);

  let itemSelector = tag + classes.map((c) => `.${c}`).join("");

  // Seletor genérico (ex.: "li" puro) casaria menu e rodapé. Escopa pelo
  // ancestral que tem id ou classe.
  if ($(itemSelector).length > cards.length * 1.6) {
    const pai = $(cards[0]).parent();
    const paiId = pai.attr("id");
    const paiCls = classesEstaveis(pai)[0];
    const escopo = paiId ? `#${paiId}` : paiCls ? `.${paiCls}` : "";
    if (escopo) itemSelector = `${escopo} ${itemSelector}`;
  }

  const itens = $(itemSelector);
  if (itens.length < 3) return null;

  const it = itens.first();

  const heading = it
    .find("h1 a,h2 a,h3 a,h4 a")
    .filter((_, a) => ehManchete(a))
    .first();
  const htag = tagDe(heading.closest("h1,h2,h3,h4").get(0)) || "h3";
  const titleSelector = `${htag} a`;

  const imageSelector = it.find("img").first().length ? "img" : "";

  // Data: <time> ou o primeiro texto-folha que casa uma data.
  let dateSelector = "";
  if (it.find("time").length) {
    dateSelector = "time";
  } else {
    it.find("*").each((_, el) => {
      if (dateSelector) return;
      const $el = $(el);
      if ($el.children().length === 0 && RE_DATA.test($el.text().trim())) {
        const cls = classesEstaveis($el)[0];
        if (cls) dateSelector = `.${cls}`;
      }
    });
  }

  // Resumo: um elemento de descrição, ou o primeiro parágrafo com texto.
  let excerptSelector = "";
  for (const s of [".descricao", ".resumo", ".excerpt", ".lead", ".chamada", "p"]) {
    const e = it.find(s).first();
    if (e.length && e.text().trim().length > 40) {
      excerptSelector = s;
      break;
    }
  }

  return {
    itemSelector,
    titleSelector,
    linkSelector: titleSelector,
    dateSelector,
    imageSelector,
    excerptSelector,
    contentSelector: "",
    quantidade: itens.length,
  };
}

/**
 * Detecta o seletor do CORPO na página de uma matéria: o bloco com mais texto
 * em parágrafos. Se ele não tem classe própria, usa o ancestral com id/classe
 * (o corpo de um Plone, por exemplo, fica solto dentro de #parent-fieldname-text).
 */
export function detectarConteudo(html: string): string {
  const $ = cheerio.load(html);

  let melhor: { el: any; chars: number } | null = null;
  $("div,article,section,main").each((_, el) => {
    const ps = $(el).children("p");
    if (ps.length < 2) return;
    const chars = ps.text().trim().length;
    if (chars < 200) return;
    if (!melhor || chars > melhor.chars) melhor = { el, chars };
  });

  if (!melhor) return "";

  let $el = $((melhor as { el: any }).el);
  // Sobe até um elemento com id ou classe utilizável.
  for (let i = 0; i < 4 && $el.length; i++) {
    const id = $el.attr("id");
    if (id) return `#${id}`;
    const cls = classesEstaveis($el);
    if (cls.length) return `${tagDe($el.get(0))}.${cls.join(".")}`;
    $el = $el.parent();
  }
  return "";
}
