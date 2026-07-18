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
  /** categoria/assunto da fonte (ex.: "Serviços") — vira tag sugerida */
  category: string;
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
  categorySelector?: string | null;
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

/** Nome de categoria válido: curto, sem virar uma data ou uma frase inteira. */
function nomeDeCategoria(bruto: string): string {
  const t = limpar(bruto);
  if (!t || t.length > 40) return "";
  if (/\d{1,2}[/.]\d{1,2}[/.]\d{4}|\d{4}-\d{2}-\d{2}/.test(t)) return ""; // é data
  return t;
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
      // Categoria da fonte: nome curto e limpo (vira tag). Datas ou frases
      // longas capturadas por engano são descartadas.
      category: fonte.categorySelector
        ? nomeDeCategoria($el.find(fonte.categorySelector).first().text())
        : "",
    });
  });

  return itens;
}

/** Períodos aceitos. Fora desta lista, cai no padrão. */
export const PERIODOS_DIAS = [7, 15, 30] as const;
export const PERIODO_PADRAO = 7;

/** Teto de itens devolvidos pela busca, qualquer que seja o período. */
export const MAX_ITENS_BUSCA = 30;

/** Só aceita período conhecido — `dias` vem do navegador. */
export function periodoValido(dias: unknown): number {
  const n = Number(dias);
  return (PERIODOS_DIAS as readonly number[]).includes(n) ? n : PERIODO_PADRAO;
}

/**
 * Mantém só o que é de hoje até `dias` atrás.
 *
 * Item sem data passa: é melhor mostrar e deixar a pessoa decidir do que
 * sumir com uma matéria por causa de um seletor de data que falhou.
 */
export function filtrarPorPeriodo(itens: ItemRaspado[], dias: number): ItemRaspado[] {
  if (!dias || dias <= 0) return itens;

  const limite = new Date();
  limite.setUTCDate(limite.getUTCDate() - dias);
  const corte = inputDeData(limite);

  // Comparação de strings yyyy-mm-dd é ordenação de data — e evita reconverter.
  return itens.filter((i) => !i.date || i.date >= corte);
}

/**
 * Texto de um bloco, com os links preservados em `[texto](url)`.
 *
 * `.text()` do cheerio devolveria só as palavras e jogaria fora o href — era
 * o que apagava as referências da matéria (a nota técnica linkada, por
 * exemplo). O formato é markdown de propósito: o `content` é renderizado
 * escapado, então guardar <a> ali mostraria a tag na tela; e interpretar HTML
 * de terceiros abriria XSS. Com marcação simples, quem monta o <a> somos nós.
 */
function textoComLinks($: cheerio.CheerioAPI, bloco: cheerio.Cheerio<any>): string {
  const clone = bloco.clone();

  clone.find("a").each((_, a) => {
    const $a = $(a);
    const texto = $a.text().trim();
    const href = ($a.attr("href") ?? "").trim();

    // Só http/https vira link. Um href "javascript:" nunca deve chegar ao
    // renderizador — e âncora interna do site de origem não serve aqui.
    if (!texto) return;
    if (!/^https?:\/\//i.test(href)) {
      $a.replaceWith(texto);
      return;
    }
    // Link cujo texto já é a própria URL não precisa de marcação.
    $a.replaceWith(texto === href ? texto : `[${texto}](${href})`);
  });

  return limpar(clone.text());
}

/** URL de embed de vídeo (YouTube/Vimeo) a partir de um src de iframe. */
function urlDeVideo(src: string): string {
  const yt = /(?:youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i.exec(src);
  if (yt) return `https://www.youtube.com/watch?v=${yt[1]}`;
  const vimeo = /(?:vimeo\.com\/(?:video\/)?)(\d+)/i.exec(src);
  if (vimeo) return `https://vimeo.com/${vimeo[1]}`;
  return "";
}

/**
 * Percorre o corpo em ORDEM e monta a marcação rica.
 *
 * Blocos separados por linha em branco, cada um num formato que o renderizador
 * (parseConteudo) reconhece:
 *   texto de parágrafo, com `[link](url)`
 *   `## Subtítulo`
 *   `![alt](url-da-imagem)`   ← posição preservada no meio do texto
 *   `@video(url)`
 *   `- item de lista`
 *
 * Antes só o texto era extraído: o gráfico do meio de uma matéria da Receita,
 * por exemplo, sumia. Agora imagem e vídeo entram no lugar certo.
 */
function extrairBlocos(
  $: cheerio.CheerioAPI,
  raiz: cheerio.Cheerio<any>,
  base: string
): string[] {
  const blocos: string[] = [];

  const imagem = (el: any) => {
    const src = imagemDe($, $(el));
    const url = absoluta(src, base);
    // SVG e ícones minúsculos não são conteúdo; a validação real é no download.
    if (!url || /\.svg(\?|$)/i.test(url)) return;
    const alt = ($(el).attr("alt") || "").trim().replace(/[[\]()]/g, "");
    blocos.push(`![${alt}](${url})`);
  };

  const walk = (no: any) => {
    for (const filho of $(no).contents().toArray() as any[]) {
      const tag = (filho.tagName || filho.name || "").toLowerCase();
      if (!tag) continue; // nó de texto solto — o conteúdo vem nos <p>

      if (tag === "img") {
        imagem(filho);
      } else if (tag === "iframe") {
        const url = urlDeVideo($(filho).attr("src") || "");
        if (url) blocos.push(`@video(${url})`);
      } else if (/^h[1-4]$/.test(tag)) {
        const t = textoComLinks($, $(filho));
        if (t) blocos.push(`## ${t}`);
      } else if (tag === "p" || tag === "blockquote") {
        const $p = $(filho);
        const t = textoComLinks($, $p);
        if (t) {
          // Subtítulo disfarçado: um <p> que é SÓ negrito, curto e sem ponto
          // final. Muitos sites (a Receita entre eles) não usam <h2> — marcam
          // seção com <p><strong>. Sem isto, viravam parágrafo comum.
          const soNegrito =
            $p.children().length > 0 &&
            $p.find("strong,b").first().text().trim() === $p.text().trim();
          if (soNegrito && t.length <= 70 && !/[.!?:,;]$/.test(t)) {
            blocos.push(`## ${t}`);
          } else {
            blocos.push(t);
          }
        }
        // imagem embrulhada num <p> continua sendo imagem
        $p.find("img").each((_, im) => imagem(im));
      } else if (tag === "ul" || tag === "ol") {
        const itens = $(filho)
          .children("li")
          .map((_, li) => textoComLinks($, $(li)))
          .get()
          .filter(Boolean)
          .map((t) => `- ${t}`);
        if (itens.length) blocos.push(itens.join("\n"));
      } else if (tag !== "li") {
        // Qualquer outro container (div, figure, dl/dt do Plone, a que embrulha
        // imagem…) é percorrido: é onde a imagem e o vídeo costumam se esconder.
        walk(filho);
      }
    }
  };

  walk(raiz.get(0));
  return blocos;
}

/**
 * Corpo da matéria, da página dela, em marcação rica.
 *
 * A listagem só tem o resumo picotado ("[...]"), que não serve de rascunho.
 */
export async function buscarConteudo(
  link: string,
  contentSelector: string
): Promise<string> {
  const html = await buscarHtml(link);
  const $ = cheerio.load(html);

  const corpo = $(contentSelector).first();
  if (corpo.length === 0) return "";

  // Fora o que não é matéria. Figure e iframe FICAM: são imagem e vídeo.
  corpo
    .find("script,style,noscript,form,.sharedaddy,.jp-relatedposts,.social,.compartilhe")
    .remove();

  const blocos = extrairBlocos($, corpo, link);
  if (blocos.length > 0) return blocos.join("\n\n");

  // Sem bloco reconhecível, o texto pode estar solto em <div>. Quebrar pelas
  // linhas em branco preserva os parágrafos em vez de fundir tudo num bloco.
  const bruto = corpo.text();
  const soltos = bruto
    .split(/\n\s*\n/)
    .map((t) => limpar(t))
    .filter((t) => t.length > 30);
  if (soltos.length > 1) return soltos.join("\n\n");

  const unico = limpar(bruto);
  return unico.length > 40 ? unico : "";
}
