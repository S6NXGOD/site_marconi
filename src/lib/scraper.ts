import * as cheerio from "cheerio";
import { buscarHtml, ScrapeError } from "./scrape-fetch";
import { hojeISO, inputDeData } from "./datas";

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

  // Relativas: muitos portais (o Contábeis entre eles) escrevem "Ontem 09:00",
  // "há 3 horas", "há 2 dias" em vez da data. Convertidas para a data no Piauí.
  const rel = semAcento(v);
  if (/\bhoje\b|\bagora\b|\bh[a]\s+\d+\s*(hora|minuto|hr|min|seg)/.test(rel)) return hojeISO();
  if (/\banteontem\b/.test(rel)) return diasAtras(2);
  if (/\bontem\b/.test(rel)) return diasAtras(1);
  const mr = /\bh[a]\s+(\d+)\s*(dia|semana|mes|mês)/.exec(rel);
  if (mr) {
    const n = Number(mr[1]);
    const fator = mr[2].startsWith("semana") ? 7 : mr[2].startsWith("m") ? 30 : 1;
    return diasAtras(n * fator);
  }

  return "";
}

/** "hoje menos N dias", no fuso do Piauí, em yyyy-mm-dd. */
function diasAtras(n: number): string {
  const base = new Date(`${hojeISO()}T12:00:00Z`);
  base.setUTCDate(base.getUTCDate() - n);
  return inputDeData(base);
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
 * Base efetiva da página. Se há `<base href>`, os links relativos resolvem
 * contra ELE, não contra a URL da página — é o que o navegador faz. O
 * Contábeis, por exemplo, lista em /conteudo/tributario/ mas usa
 * `<base href="https://www.contabeis.com.br/">`, então "artigos/123/" vira
 * /artigos/123/, não /conteudo/tributario/artigos/123/.
 */
function baseEfetiva($: cheerio.CheerioAPI, urlPagina: string): string {
  const href = $("base[href]").first().attr("href");
  if (!href) return urlPagina;
  try {
    return new URL(href, urlPagina).toString();
  } catch {
    return urlPagina;
  }
}

/**
 * Extrai os itens de UMA página de listagem já carregada.
 *
 * O `vistos` é compartilhado entre as páginas: a mesma matéria costuma reaparecer
 * no topo da página seguinte (e no destaque + na lista da mesma página), e não
 * pode entrar duas vezes. Só o link é obrigatório — é a identidade da matéria e
 * o que permite detectar a reimportação. Sem título, o item não serve para nada.
 */
function extrairItens(
  $: cheerio.CheerioAPI,
  containers: cheerio.Cheerio<any>,
  base: string,
  fonte: Fonte,
  vistos: Set<string>
): ItemRaspado[] {
  const itens: ItemRaspado[] = [];

  containers.each((_, el) => {
    const $el = $(el);

    const title = limpar(
      fonte.titleSelector ? $el.find(fonte.titleSelector).first().text() : $el.find("h1,h2,h3,h4").first().text()
    );

    const hrefBruto = fonte.linkSelector
      ? $el.find(fonte.linkSelector).first().attr("href")
      : $el.find("a[href]").first().attr("href");
    const link = absoluta(hrefBruto ?? "", base);

    if (!title || !link) return;
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
        ? absoluta(imagemDe($, $el.find(fonte.imageSelector)), base)
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

/**
 * URL da PRÓXIMA página da listagem — ou null quando não há.
 *
 * Segue a paginação que dá para seguir de um servidor: a renderizada no HTML.
 * Primeiro o padrão `<link rel=next>` / `<a rel=next>`; como reforço, um link de
 * rodapé cujo texto é "próxima" / "seguinte" / "»". Números de página
 * (`?pagina=2`, `/page/2/`) chegam por esses mesmos `<a>`, então não é preciso
 * adivinhar o formato da URL do site.
 *
 * "Carregar mais" por JavaScript — que não troca a URL — NÃO tem como ser
 * seguido daqui: nesse caso devolve null e a busca fica na primeira página.
 */
function proximaPagina(
  $: cheerio.CheerioAPI,
  base: string,
  jaVistas: Set<string>
): string | null {
  const candidatos: string[] = [];
  const anota = (href: string | undefined | null) => {
    if (href) candidatos.push(href);
  };

  // rel=next é o sinal mais confiável — é o que o padrão reserva para isto.
  $('a[rel~="next"]').each((_, el) => anota($(el).attr("href")));
  $('link[rel="next"]').each((_, el) => anota($(el).attr("href")));

  // Reforço: um link cujo texto ou aria-label é "próxima"/"seguinte"/"»".
  if (candidatos.length === 0) {
    $("a[href]").each((_, el) => {
      const $a = $(el);
      const rotulo = semAcento(`${$a.text()} ${$a.attr("aria-label") ?? ""}`)
        .replace(/\s+/g, " ")
        .trim();
      if (
        /(^|\s)(proxima|proximo|seguinte|next)(\s|$)/.test(rotulo) ||
        rotulo === "»" ||
        rotulo === "›"
      ) {
        anota($a.attr("href"));
      }
    });
  }

  for (const href of candidatos) {
    // Sem a âncora: "…/pagina/2#topo" é a mesma página 2.
    const abs = absoluta(href, base).split("#")[0];
    if (abs && !jaVistas.has(abs)) return abs;
  }
  return null;
}

/** Opções da busca. Sem nenhuma, lê só a primeira página (jeito antigo). */
export type OpcoesBusca = {
  /** Janela desejada em dias — orienta até onde vale a pena paginar. */
  dias?: number;
  /** Teto de páginas da listagem a seguir (rede de segurança). */
  maxPaginas?: number;
  /** Teto de itens a coletar no total, somando as páginas. */
  maxItens?: number;
};

/**
 * Lê a listagem e devolve os itens encontrados. NÃO grava nada.
 *
 * Por padrão lê só a primeira página. Com `maxPaginas > 1`, segue a paginação do
 * site até cobrir a janela pedida (`dias`): a listagem vem do mais recente para
 * o mais antigo, então quando aparece um item mais VELHO que o corte, as páginas
 * seguintes só teriam matéria ainda mais antiga — e a busca para ali.
 *
 * É isto que faz "Últimos 30 dias" trazer de fato 30 dias. A primeira página
 * costuma ter só as ~10-15 matérias mais novas, e o resto do mês está nas
 * páginas seguintes; sem paginar, 7, 15 e 30 dias devolviam quase o mesmo (e,
 * numa fonte sem data na listagem, exatamente o mesmo).
 */
export async function buscarItens(
  fonte: Fonte,
  opcoes: OpcoesBusca = {}
): Promise<ItemRaspado[]> {
  const maxPaginas = Math.max(1, opcoes.maxPaginas ?? 1);
  const maxItens = opcoes.maxItens ?? Infinity;
  const corte = opcoes.dias && opcoes.dias > 0 ? corteDeDias(opcoes.dias) : "";

  const itens: ItemRaspado[] = [];
  const vistos = new Set<string>();
  const paginasVistas = new Set<string>();

  let urlAtual: string | null = fonte.url;

  for (let pagina = 0; urlAtual && pagina < maxPaginas; pagina++) {
    if (paginasVistas.has(urlAtual)) break; // trava contra laço de paginação
    paginasVistas.add(urlAtual);

    const html = await buscarHtml(urlAtual);
    const $ = cheerio.load(html);
    const base = baseEfetiva($, urlAtual);

    const containers = $(fonte.itemSelector);
    if (containers.length === 0) {
      // Na 1ª página, o seletor não casar é erro de configuração e precisa
      // aparecer na tela. Nas seguintes, é só o fim da lista: para em silêncio.
      if (pagina === 0) {
        throw new ScrapeError(
          `O seletor de itens ("${fonte.itemSelector}") não encontrou nada na página. ` +
            "O site pode ter mudado de layout."
        );
      }
      break;
    }

    const novos = extrairItens($, containers, base, fonte, vistos);
    itens.push(...novos);

    // Página que não trouxe nada novo (paginação que repete o topo, ou um
    // "carregar mais" por JS que devolve o mesmo HTML): seguir não adianta.
    if (novos.length === 0) break;
    if (itens.length >= maxItens) break;
    // Cruzou a borda da janela? O resto da listagem é ainda mais antigo.
    if (corte && novos.some((i) => i.date && i.date < corte)) break;

    urlAtual = proximaPagina($, base, paginasVistas);
  }

  return maxItens === Infinity ? itens : itens.slice(0, maxItens);
}

/** Períodos aceitos. Fora desta lista, cai no padrão. */
export const PERIODOS_DIAS = [7, 15, 30] as const;
export const PERIODO_PADRAO = 7;

/** Teto de itens devolvidos pela busca, qualquer que seja o período. */
export const MAX_ITENS_BUSCA = 40;

/** Teto de páginas da listagem que uma busca percorre — rede de segurança. */
export const MAX_PAGINAS_BUSCA = 5;

/**
 * Quantas páginas seguir para cada período. Mais dias pedem ir mais fundo na
 * listagem; num período curto, a 1ª (ou 2ª) página já basta. Numa fonte COM
 * data a busca ainda para sozinha ao cruzar o corte — este é só o teto.
 */
export function maxPaginasPara(dias: number): number {
  if (dias >= 30) return MAX_PAGINAS_BUSCA;
  if (dias >= 15) return 3;
  return 2;
}

/** Só aceita período conhecido — `dias` vem do navegador. */
export function periodoValido(dias: unknown): number {
  const n = Number(dias);
  return (PERIODOS_DIAS as readonly number[]).includes(n) ? n : PERIODO_PADRAO;
}

/** String yyyy-mm-dd de `dias` atrás, no fuso do Piauí. É a borda da janela. */
function corteDeDias(dias: number): string {
  const limite = new Date();
  limite.setUTCDate(limite.getUTCDate() - dias);
  return inputDeData(limite);
}

/**
 * Mantém só o que é de hoje até `dias` atrás.
 *
 * Item sem data passa: é melhor mostrar e deixar a pessoa decidir do que
 * sumir com uma matéria por causa de um seletor de data que falhou.
 */
export function filtrarPorPeriodo(itens: ItemRaspado[], dias: number): ItemRaspado[] {
  if (!dias || dias <= 0) return itens;

  const corte = corteDeDias(dias);
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
 * Subtítulo/linha-fina da matéria — o resumo que o autor escreveu, logo abaixo
 * do título. Fica na PÁGINA da matéria, não na listagem, e é melhor resumo do
 * que a primeira frase do corpo.
 *
 * Procura as classes usuais ("linha de olho", "subtítulo", "lead"…) e, como
 * reforço, o elemento logo depois do <h1>. Ignora o og:description porque
 * alguns sites (o Contábeis) o deixam genérico/desatualizado.
 */
function extrairSubtitulo($: cheerio.CheerioAPI): string {
  const bom = (t: string) => t.length >= 30 && t.length <= 400;

  for (const s of [
    ".linhadeolho", ".linhadeOlho", ".linha-fina", ".linhafina", ".olho",
    ".subtitulo", ".subtitle", ".sub-titulo", ".lead", ".chamada",
    ".excerpt", ".summary", ".resumo", ".deck", ".standfirst", ".dek",
  ]) {
    const t = limpar($(s).first().text());
    if (bom(t)) return t;
  }

  // Elemento logo após o <h1> (h2/p costumam ser a linha-fina). Fallback com
  // guarda: só aceita PROSA — várias palavras, sem cara de crédito/data — para
  // não confundir "Por Assessoria" ou "15 de julho de 2026" com resumo.
  const h1 = $("h1").first();
  if (h1.length) {
    const prox = h1.next();
    if (prox.is("h2,h3,p")) {
      const t = limpar(prox.text());
      const ehCredito = /^(por|texto|fonte|foto|de)\b/i.test(t);
      const ehData = /^\d{1,2}(\/\d| de )/.test(t);
      if (bom(t) && t.split(/\s+/).length >= 6 && !ehCredito && !ehData) return t;
    }
  }
  return "";
}

/**
 * Corpo da matéria (marcação rica) e o subtítulo, da página dela.
 *
 * A listagem só tem o resumo picotado ("[...]"), que não serve de rascunho.
 */
export async function buscarConteudo(
  link: string,
  contentSelector: string
): Promise<{ content: string; subtitulo: string }> {
  const html = await buscarHtml(link);
  const $ = cheerio.load(html);

  const subtitulo = extrairSubtitulo($);
  const corpo = $(contentSelector).first();
  if (corpo.length === 0) return { content: "", subtitulo };

  // Fora o que não é matéria. Figure e iframe FICAM: são imagem e vídeo.
  // Além do óbvio (script/form), tira blocos de compartilhamento, relacionadas
  // e publicidade — o "leia também" e o banner de evento que os portais cravam
  // no meio/fim do corpo. O que escapar, a edição do rascunho remove.
  corpo
    .find(
      "script,style,noscript,form,iframe[src*='ads']," +
        ".sharedaddy,.jp-relatedposts,.social,.compartilhe,.compartilhamento," +
        ".relacionadas,.related,.leia-tambem,.veja-tambem,.mais-lidas," +
        ".newsletter,.publicidade,.propaganda,.banner,.ads,.ad,.anuncio"
    )
    .remove();

  const blocos = extrairBlocos($, corpo, baseEfetiva($, link));
  if (blocos.length > 0) return { content: blocos.join("\n\n"), subtitulo };

  // Sem bloco reconhecível, o texto pode estar solto em <div>. Quebrar pelas
  // linhas em branco preserva os parágrafos em vez de fundir tudo num bloco.
  const bruto = corpo.text();
  const soltos = bruto
    .split(/\n\s*\n/)
    .map((t) => limpar(t))
    .filter((t) => t.length > 30);
  if (soltos.length > 1) return { content: soltos.join("\n\n"), subtitulo };

  const unico = limpar(bruto);
  return { content: unico.length > 40 ? unico : "", subtitulo };
}
