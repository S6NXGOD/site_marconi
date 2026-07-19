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
  categorySelector: string;
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

  // Manchete = um HEADING (h1-h4) com texto de corpo, ligado a um link do mesmo
  // site. O link tanto pode estar DENTRO do heading (<h2><a>…</a></h2>) quanto
  // ENVOLVER o heading (<a><h2>…</h2></a>) — os sites variam entre os dois, e
  // reconhecer só um fazia a detecção falhar em portais como o Contábeis.
  const linkDoHeading = (h: any): any | null => {
    const $h = $(h);
    if ($h.text().trim().length < 20) return null;
    let $a: any = $h.find("a[href]").first();
    if ($a.length === 0) $a = $h.closest("a[href]");
    if ($a.length === 0) return null;
    try {
      if (new URL($a.attr("href") || "", baseUrl).hostname !== host) return null;
    } catch {
      return null;
    }
    return $a.get(0);
  };
  const contaManchetes = (el: any): number =>
    $(el).find("h1,h2,h3,h4").filter((_, h) => linkDoHeading(h) !== null).length;

  const manchetes = $("h1,h2,h3,h4")
    .filter((_, h) => linkDoHeading(h) !== null)
    .toArray();
  if (manchetes.length < 3) return null;

  // Card = ancestral mais externo que ainda contém UMA só manchete. Subir além
  // disso entraria na lista, que tem várias.
  const cards: any[] = [];
  for (const h of manchetes) {
    let el = $(h);
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

  // O título é o próprio heading (o texto dele funciona nos dois padrões).
  const headingEl = it
    .find("h1,h2,h3,h4")
    .filter((_, h) => linkDoHeading(h) !== null)
    .first();
  const htag = tagDe(headingEl.get(0)) || "h3";
  const clsHead = classesEstaveis(headingEl)[0];
  const titleSelector = clsHead ? `${htag}.${clsHead}` : htag;

  // Link: se o <a> está DENTRO do heading, aponta pra ele; se ENVOLVE o
  // heading, a extração já pega o primeiro <a> do item (linkSelector vazio).
  const linkSelector = headingEl.find("a[href]").length > 0 ? `${titleSelector} a` : "";

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

  // Categoria/assunto: um rótulo curto (não data, não frase). Nomes comuns
  // em portais BR: .subtitulo-noticia (Receita), .editoria, .categoria…
  let categorySelector = "";
  for (const s of [
    ".subtitulo-noticia", ".editoria", ".categoria", ".category",
    ".cat-links a", ".post-category", "[rel~='category']", ".assunto", ".tag",
  ]) {
    const e = it.find(s).first();
    const t = e.text().trim();
    if (
      e.length && t.length >= 2 && t.length <= 40 &&
      !RE_DATA.test(t) && !/^\d+$/.test(t)
    ) {
      categorySelector = s;
      break;
    }
  }

  return {
    itemSelector,
    titleSelector,
    linkSelector,
    dateSelector,
    imageSelector,
    excerptSelector,
    categorySelector,
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
