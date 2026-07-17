import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buscarItens, filtrarPorPeriodo, type ItemRaspado } from "@/lib/scraper";
import { ScrapeError } from "@/lib/scrape-fetch";

export const runtime = "nodejs";
// Buscar uma página externa e parsear passa do limite padrão com folga.
export const maxDuration = 60;

/**
 * Busca as notícias de uma fonte. NÃO grava nada.
 *
 * Devolve tudo que encontrou, inclusive o que já foi importado — marcado com
 * `jaImportada`. Esconder seria pior: a pessoa procuraria pela matéria que
 * sabe que existe e não entenderia a ausência.
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  let body: { sourceId?: string; dias?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const sourceId = String(body.sourceId ?? "");
  if (!sourceId) {
    return NextResponse.json({ error: "Selecione uma fonte." }, { status: 400 });
  }

  const fonte = await prisma.scrapeSource.findUnique({ where: { id: sourceId } });
  if (!fonte) {
    return NextResponse.json({ error: "Fonte não encontrada." }, { status: 404 });
  }

  const dias = Number.isFinite(body.dias) ? Number(body.dias) : 0;

  let itens: ItemRaspado[];
  try {
    itens = await buscarItens(fonte);
  } catch (e) {
    // Erro de raspagem é operacional (site fora do ar, layout mudou), não bug:
    // a mensagem tem que chegar na tela para a pessoa saber o que fazer.
    if (e instanceof ScrapeError) {
      return NextResponse.json({ error: e.message }, { status: 422 });
    }
    console.error("[scrape] falha inesperada:", e);
    return NextResponse.json(
      { error: "Falha ao ler a página da fonte." },
      { status: 500 }
    );
  }

  const noPeriodo = filtrarPorPeriodo(itens, dias);

  // Uma consulta só para todos os links, em vez de uma por item.
  const jaExistem = await prisma.news.findMany({
    where: { sourceUrl: { in: noPeriodo.map((i) => i.link) } },
    select: { sourceUrl: true },
  });
  const importados = new Set(jaExistem.map((n) => n.sourceUrl));

  const resultado = noPeriodo.map((i) => ({
    ...i,
    jaImportada: importados.has(i.link),
  }));

  await prisma.scrapeSource.update({
    where: { id: fonte.id },
    data: { lastRunAt: new Date() },
  });

  return NextResponse.json({
    itens: resultado,
    total: itens.length,
    noPeriodo: noPeriodo.length,
    novas: resultado.filter((i) => !i.jaImportada).length,
    fonte: { id: fonte.id, name: fonte.name, category: fonte.category },
  });
}
