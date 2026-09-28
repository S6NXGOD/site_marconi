import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { buscarHtml, ScrapeError } from "@/lib/scrape-fetch";
import { detectarListagem, detectarConteudo } from "@/lib/scrape-detect";
import { buscarItens } from "@/lib/scraper";

export const runtime = "nodejs";
// Busca a listagem e ainda algumas matérias (para o seletor de corpo, em
// paralelo). Várias requisições externas passam do limite padrão.
export const maxDuration = 60;

/**
 * Detecta os seletores de uma fonte a partir da URL da listagem.
 *
 * Preenche o formulário para a pessoa não precisar caçar classe CSS no
 * inspetor. O resultado é revisado no "Testar seletores" antes de salvar — é
 * sugestão, não decisão.
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const url = String(body.url ?? "").trim();
  if (!url) {
    return NextResponse.json({ error: "Informe a URL da listagem." }, { status: 400 });
  }

  // buscarHtml já valida o esquema, resolve o host e barra rede interna.
  let html: string;
  try {
    html = await buscarHtml(url);
  } catch (e) {
    if (e instanceof ScrapeError) {
      return NextResponse.json({ error: e.message }, { status: 422 });
    }
    console.error("[scrape/detectar] falha ao buscar:", e);
    return NextResponse.json({ error: "Não consegui abrir a página." }, { status: 500 });
  }

  const seletores = detectarListagem(html, url);
  if (!seletores) {
    return NextResponse.json(
      {
        error:
          "Não reconheci um padrão de notícias nesta página. Confira se é a " +
          "página que LISTA as matérias — e, se o site carregar o conteúdo por " +
          "JavaScript, a detecção não alcança.",
      },
      { status: 422 }
    );
  }

  // Roda os seletores achados para devolver uma amostra e os links das matérias.
  let amostra: { title: string; date: string; imageUrl: string }[] = [];
  let links: string[] = [];
  try {
    const itens = await buscarItens({ url, ...seletores });
    links = itens.slice(0, MATERIAS_AMOSTRADAS).map((i) => i.link);
    amostra = itens.slice(0, 3).map((i) => ({
      title: i.title,
      date: i.date,
      imageUrl: i.imageUrl,
    }));
  } catch {
    // A amostra é um extra; a detecção principal já valeu.
  }

  const contentSelector = await detectarCorpo(links);

  return NextResponse.json({
    ...seletores,
    contentSelector,
    nomeSugerido: nomeDaFonte(html, url),
    amostra,
  });
}

/** Quantas matérias abrir para decidir o seletor do corpo. */
const MATERIAS_AMOSTRADAS = 3;

/**
 * Seletor do corpo: abre algumas matérias e fica com o seletor que mais se
 * repete entre elas.
 *
 * Uma matéria só não basta: a primeira da lista pode ser atípica — no TRE-PI
 * era um texto colado do Word, e o campo voltava vazio. As páginas são
 * buscadas em paralelo para caber no tempo da rota.
 */
async function detectarCorpo(links: string[]): Promise<string> {
  const resultados = await Promise.allSettled(
    links.map(async (link) => detectarConteudo(await buscarHtml(link)))
  );

  const votos = new Map<string, number>();
  for (const r of resultados) {
    // Página que não abriu ou sem corpo reconhecível não vota.
    if (r.status === "fulfilled" && r.value) {
      votos.set(r.value, (votos.get(r.value) ?? 0) + 1);
    }
  }

  // Empate fica com o da primeira matéria da lista (a Map guarda a ordem).
  let vencedor = "";
  let maior = 0;
  votos.forEach((n, seletor) => {
    if (n > maior) {
      vencedor = seletor;
      maior = n;
    }
  });
  // Sem o corpo, o rascunho nasce só com o resumo — a fonte ainda serve.
  return vencedor;
}

/** Nome-palpite para a fonte, a partir do site. A pessoa ajusta depois. */
function nomeDaFonte(html: string, url: string): string {
  const og = /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i.exec(html);
  if (og?.[1]?.trim()) return `${og[1].trim()} — Notícias`;
  try {
    return `${new URL(url).hostname.replace(/^www\./, "")} — Notícias`;
  } catch {
    return "";
  }
}
