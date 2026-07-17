import * as cheerio from "cheerio";
import { buscarHtml, ScrapeError } from "./scrape-fetch";
import { inputDeData } from "./datas";

export type ItemRaspado = {
  title: string;
  /** link absoluto da matéria — é a identidade dela */
  link: string;
  /** yyyy-mm-dd; vazio quando a fonte não expõe data */
  date: string;
  excerpt: string;
  imageUrl: string;
  /** já existe no banco — vem marcado para o painel explicar o porquê */
  jaImportada?: boolean;
};

const MESES: Record<string, number> = {
  janeiro: 1, fevereiro: 2, marco: 3, abril: 4, maio: 5, junho: 6,
  julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12,
  jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6,
  jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12,
};

function semAcento(v: string): string {
  return v.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * Data da listagem em yyyy-mm-dd.
 *
 * Cada site escreve de um jeito, e não dá para exigir que o admin normalize
 * nada: o formato é o que o HTML entregar. Cobre o texto por extenso
 * ("15 de julho de 2026", que é o do TCE-PI), dd/mm/yyyy e ISO — inclusive o
 * datetime de um <time>.
 */
export function parseDataRaspada(bruta: string): string {
  const v = bruta.trim();
  if (!v) return "";

  const p = (n: number) => String(n).padStart(2, "0");
  const monta = (a: number, m: number, d: number) => {
    if (m < 1 || m > 12 || d < 1 || d > 31) return "";
    const dt = new Date(Date.UTC(a, m - 1, d, 12));
    // Recusa 31/02 e afins, que o Date "conserta" em silêncio.
    if (dt.getUTCDate() !== d || dt.getUTCMonth() !== m - 1) return "";
    return `${a}-${p(m)}-${p(d)}`;
  };

  // ISO / datetime do <time> (2026-07-15, 2026-07-15T10:00:00-03:00)
  const iso = /(\d{4})-(\d{2})-(\d{2})/.exec(v);
  if (iso) return monta(+iso[1], +iso[2], +iso[3]);

  // 15/07/2026 e 15.07.2026
  const br = /(\d{1,2})[/.](\d{1,2})[/.](\d{4})/.exec(v);
  if (br) return monta(+br[3], +br[2], +br[1]);

  // "15 de julho de 2026" / "15 jul 2026"
  const ext = /(\d{1,2})\s*(?:de\s+)?([a-zà-ú]{3,})\.?\s*(?:de\s+)?(\d{4})/i.exec(v);
  if (ext) {
    const mes = MESES[semAcento(ext[2])];
    if (mes) return monta(+ext[3], mes, +ext[1]);
  }

  return "";
}

/** Espaços do HTML viram um espaço só; parágrafo vira linha em branco. */
function limpar(texto: string): string {
  return texto.replace(/\s+/g, " ").trim();
}

export type Fonte = {
  url: string;
  itemSelector: string;
  titleSelector?: string | null;
  linkSelector?: string | null;
  dateSelector?: string | null;
  imageSelector?: string | null;
  excerptSelector?: string | null;
  contentSelector?: string | null;
};

/**
 * `src` nem sempre é o endereço real da imagem: temas com lazy-load põem um
 * placeholder no src e o endereço bom em data-src. Vale tentar os dois.
 */
function imagemDe($: cheerio.CheerioAPI, el: cheerio.Cheerio<any>): string {
  const img = el.first();
  if (img.length === 0) return "";
  for (const attr of ["src", "data-src", "data-lazy-src", "data-original"]) {
    const v = img.attr(attr);
    if (v && !v.startsWith("data:")) return v;
  }
  // <img srcset="a.jpg 200w, b.jpg 800w"> — pega o primeiro
  const srcset = img.attr("srcset");
  if (srcset) return srcset.split(",")[0]?.trim().split(/\s+/)[0] ?? "";
  return "";
}

/** Resolve href/src relativo contra a página de origem. */
function absoluta(valor: string, base: string): string {
  if (!valor) return "";
  try {
    return new URL(valor, base).toString();
  } catch {
    return "";
  }
}

/**
 * Lê a listagem e devolve os itens encontrados. NÃO grava nada.
 *
 * Só o link é obrigatório: é a identidade da matéria e o que permite detectar
 * a reimportação. Sem título, o item não serve para nada, então cai fora.
 */
export async function buscarItens(fonte: Fonte): Promise<ItemRaspado[]> {
  const html = await buscarHtml(fonte.url);
  const $ = cheerio.load(html);

  const containers = $(fonte.itemSelector);
  if (containers.length === 0) {
    throw new ScrapeError(
      `O seletor de itens ("${fonte.itemSelector}") não encontrou nada na página. ` +
        "O site pode ter mudado de layout."
    );
  }

  const itens: ItemRaspado[] = [];
  const vistos = new Set<string>();

  containers.each((_, el) => {
    const $el = $(el);

    const title = limpar(
      fonte.titleSelector ? $el.find(fonte.titleSelector).first().text() : $el.find("h1,h2,h3,h4").first().text()
    );

    const hrefBruto = fonte.linkSelector
      ? $el.find(fonte.linkSelector).first().attr("href")
      : $el.find("a[href]").first().attr("href");
    const link = absoluta(hrefBruto ?? "", fonte.url);

    if (!title || !link) return;
    // A mesma matéria costuma aparecer no destaque e na lista.
    if (vistos.has(link)) return;
    vistos.add(link);

    itens.push({
      title,
      link,
      date: fonte.dateSelector
        ? parseDataRaspada($el.find(fonte.dateSelector).first().text())
        : "",
      excerpt: fonte.excerptSelector
        ? limpar($el.find(fonte.excerptSelector).first().text())
        : "",
      imageUrl: fonte.imageSelector
        ? absoluta(imagemDe($, $el.find(fonte.imageSelector)), fonte.url)
        : "",
    });
  });

  return itens;
}

/** Mantém só o que é de hoje até `dias` atrás. Item sem data sempre passa. */
export function filtrarPorPeriodo(itens: ItemRaspado[], dias: number): ItemRaspado[] {
  if (!dias || dias <= 0) return itens;

  const limite = new Date();
  limite.setUTCDate(limite.getUTCDate() - dias);
  const corte = inputDeData(limite);

  // Comparação de strings yyyy-mm-dd é ordenação de data — e evita reconverter.
  return itens.filter((i) => !i.date || i.date >= corte);
}

/**
 * Texto da matéria, da página dela.
 *
 * A listagem só tem o resumo picotado ("[...]"), que não serve de rascunho.
 * Devolve texto puro, com linha em branco entre parágrafos, que é o formato
 * que o campo `content` já usa.
 */
export async function buscarConteudo(
  link: string,
  contentSelector: string
): Promise<string> {
  const html = await buscarHtml(link);
  const $ = cheerio.load(html);

  const corpo = $(contentSelector).first();
  if (corpo.length === 0) return "";

  // Fora o que não é matéria e viraria lixo no meio do texto.
  corpo.find("script,style,noscript,iframe,form,figure,figcaption,.sharedaddy,.jp-relatedposts").remove();

  const paragrafos = corpo
    .find("p")
    .map((_, p) => limpar($(p).text()))
    .get()
    .filter((t) => t.length > 0);

  // Sem <p>, o texto pode estar solto em <div> — melhor que devolver vazio.
  if (paragrafos.length === 0) {
    const solto = limpar(corpo.text());
    return solto.length > 40 ? solto : "";
  }

  return paragrafos.join("\n\n");
}
