import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { buscarItens, type Fonte } from "@/lib/scraper";
import { ScrapeError } from "@/lib/scrape-fetch";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Testa seletores sem precisar salvar a fonte.
 *
 * Existe porque acertar seletor CSS às cegas é tentativa e erro: sem isso, a
 * pessoa salvaria a fonte, iria para a tela de execução, veria "não encontrei
 * nada", voltaria, chutaria outro seletor. Aqui o retorno é imediato.
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  let body: Partial<Fonte>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  if (!body.url || !body.itemSelector) {
    return NextResponse.json(
      { error: "Informe a URL e o seletor dos itens." },
      { status: 400 }
    );
  }

  try {
    const itens = await buscarItens(body as Fonte);
    return NextResponse.json({ total: itens.length, itens: itens.slice(0, 3) });
  } catch (e) {
    if (e instanceof ScrapeError) {
      return NextResponse.json({ error: e.message }, { status: 422 });
    }
    console.error("[scrape/testar] falha inesperada:", e);
    return NextResponse.json({ error: "Falha ao ler a página." }, { status: 500 });
  }
}
