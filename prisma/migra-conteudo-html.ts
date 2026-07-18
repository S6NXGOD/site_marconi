/**
 * Migra o corpo das notícias da marcação antiga (## / ![]() / [](url)) para
 * HTML — o formato que o editor visual e a página passam a usar.
 *
 * Idempotente: só toca no que ainda NÃO parece HTML. Depois de convertida,
 * `pareceHtml` é verdadeiro e a linha é pulada. Roda no boot pela mesma razão
 * do `normaliza-capas`: o conteúdo está no banco de produção, fora do alcance
 * de qualquer correção feita na máquina de desenvolvimento.
 */
import { PrismaClient } from "@prisma/client";
import { markupParaHtml, pareceHtml } from "../src/lib/markup-html";

export async function migrarConteudoParaHtml(prisma: PrismaClient) {
  const noticias = await prisma.news.findMany({
    select: { id: true, content: true },
  });

  const pendentes = noticias.filter((n) => n.content && !pareceHtml(n.content));
  if (pendentes.length === 0) return;

  console.log(`[conteúdo] ${pendentes.length} notícia(s) para converter em HTML`);

  for (const n of pendentes) {
    try {
      await prisma.news.update({
        where: { id: n.id },
        data: { content: markupParaHtml(n.content) },
      });
    } catch (e) {
      // Uma linha problemática não pode travar o boot inteiro.
      console.warn(`[conteúdo] falhou em ${n.id}:`, (e as Error).message);
    }
  }
}

if (require.main === module) {
  const prisma = new PrismaClient();
  migrarConteudoParaHtml(prisma)
    .catch((e) => console.error("[conteúdo] erro:", e))
    .finally(() => prisma.$disconnect());
}
