import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UPLOAD_DIR } from "@/lib/uploads";
import { otimizarImagem } from "@/lib/image-pipeline";
import { buscarImagem } from "@/lib/scrape-fetch";
import { buscarConteudo, parseDataRaspada } from "@/lib/scraper";
import { slugUnico, slugDaNoticia } from "@/lib/slug-unico";
import { dataDeInput } from "@/lib/datas";
import { autorDe } from "@/lib/news";
import { semMarcacao } from "@/lib/texto-rico";

export const runtime = "nodejs";
// Cada item baixa a página da matéria e a imagem. Com vários selecionados,
// o padrão não dá conta.
export const maxDuration = 300;

/**
 * Teto por importação.
 *
 * Cada item aqui custa duas requisições externas (a página da matéria e a
 * imagem) mais o sharp. É a operação cara do módulo — a busca é uma
 * requisição só. Dez de cada vez cabe no tempo da rota com folga.
 */
const MAX_ITENS = 10;

type ItemPedido = {
  title?: string;
  link?: string;
  date?: string;
  excerpt?: string;
  imageUrl?: string;
};

/**
 * A capa é baixada e reprocessada em vez de guardar o link do site de origem.
 *
 * Dois motivos concretos: `remotePatterns` está vazio no next.config de
 * propósito (para o site não virar proxy de imagem de terceiros), então uma
 * URL externa simplesmente não renderizaria; e o preview do WhatsApp aponta
 * para o arquivo cru — que passaria a depender do site da fonte continuar no ar
 * e servindo aquele arquivo.
 */
async function baixarCapa(url: string): Promise<string | null> {
  const bytes = await buscarImagem(url);
  if (!bytes) return null;

  try {
    const otimizada = await otimizarImagem(bytes);
    const nome = `${Date.now()}-${randomBytes(6).toString("hex")}.${otimizada.ext}`;
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, nome), otimizada.buffer);
    return `/api/uploads/${nome}`;
  } catch (e) {
    // Capa é acessório: a matéria entra sem imagem em vez de falhar inteira.
    console.warn("[scrape/import] capa descartada:", (e as Error).message);
    return null;
  }
}

/** Resumo curto para o card, a partir do que houver. */
function resumoDe(excerpt: string, conteudo: string): string | null {
  // O "[...]" que os temas WordPress cravam no fim do resumo não faz sentido
  // fora da listagem de origem.
  // O "[...]" que os temas WordPress cravam no fim do resumo não faz sentido
  // fora da listagem; a marcação de link também não, no resumo.
  const base = semMarcacao(excerpt || conteudo).replace(/\s*\[[^\]]*\]\s*$/, "").trim();
  if (!base) return null;
  return base.length > 220 ? `${base.slice(0, 217)}…` : base;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  let body: { sourceId?: string; itens?: ItemPedido[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const fonte = await prisma.scrapeSource.findUnique({
    where: { id: String(body.sourceId ?? "") },
  });
  if (!fonte) {
    return NextResponse.json({ error: "Fonte não encontrada." }, { status: 404 });
  }

  const pedidos = Array.isArray(body.itens) ? body.itens.slice(0, MAX_ITENS) : [];
  if (pedidos.length === 0) {
    return NextResponse.json({ error: "Nenhuma notícia selecionada." }, { status: 400 });
  }

  // O corpo da requisição vem do navegador e não é prova de nada: sem esta
  // trava, a rota buscaria qualquer endereço que fosse mandado nela. Só passa
  // link do mesmo host da fonte cadastrada.
  const hostDaFonte = new URL(fonte.url).hostname;

  const criadas: { title: string; slug: string }[] = [];
  const falhas: { title: string; motivo: string }[] = [];

  for (const pedido of pedidos) {
    const title = String(pedido.title ?? "").trim();
    const link = String(pedido.link ?? "").trim();

    if (!title || !link) {
      falhas.push({ title: title || "(sem título)", motivo: "Título ou link ausente." });
      continue;
    }

    try {
      if (new URL(link).hostname !== hostDaFonte) {
        falhas.push({ title, motivo: "O link não pertence ao site da fonte." });
        continue;
      }
    } catch {
      falhas.push({ title, motivo: "Link inválido." });
      continue;
    }

    if (await prisma.news.findUnique({ where: { sourceUrl: link } })) {
      falhas.push({ title, motivo: "Já importada." });
      continue;
    }

    try {
      // O resumo da listagem vem picotado; o texto de verdade está na matéria.
      const conteudo = fonte.contentSelector
        ? await buscarConteudo(link, fonte.contentSelector)
        : "";
      const excerpt = String(pedido.excerpt ?? "").trim();
      const corpo = conteudo || excerpt;

      if (!corpo) {
        falhas.push({ title, motivo: "Não consegui extrair o texto da matéria." });
        continue;
      }

      const capa = pedido.imageUrl ? await baixarCapa(String(pedido.imageUrl)) : null;

      // A data vem da fonte; sem data legível, entra como hoje.
      const dia = parseDataRaspada(String(pedido.date ?? ""));
      const publishedAt = (dia ? dataDeInput(dia) : null) ?? new Date();

      const nova = await prisma.news.create({
        data: {
          title,
          // slugDaNoticia antes do slugUnico: `slugUnico` só normaliza e
          // resolve colisão. Sem isto, o título inteiro do órgão vira slug —
          // saíam endereços de 114 caracteres.
          slug: await slugUnico(slugDaNoticia("", title)),
          excerpt: resumoDe(excerpt, corpo),
          content: corpo,
          coverImage: capa,
          category: fonte.category,
          author: autorDe(fonte.category),
          // Sempre rascunho: o material é de terceiros e passa por edição e
          // conferência antes de ir ao ar. Publicar direto é o que este fluxo
          // existe para impedir.
          isPublished: false,
          publishedAt,
          sourceUrl: link,
          sourceName: fonte.name,
        },
        select: { title: true, slug: true },
      });

      criadas.push(nova);
    } catch (e) {
      console.error("[scrape/import] falhou em", link, e);
      falhas.push({ title, motivo: "Erro ao importar esta matéria." });
    }
  }

  return NextResponse.json({ criadas, falhas });
}
