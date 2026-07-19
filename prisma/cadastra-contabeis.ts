/**
 * Cadastra a fonte "Contábeis — Tributário" no banco.
 *
 * ⚠️ SCRIPT AVULSO — roda À MÃO, uma vez. NÃO está no seed nem no boot, então
 * não dispara a cada deploy. É idempotente: se a fonte (mesma URL) já existir,
 * só avisa e sai, sem duplicar.
 *
 * Como rodar em produção (Railway):
 *   railway run npx tsx prisma/cadastra-contabeis.ts
 * Ou localmente, apontando DATABASE_URL para a produção:
 *   npx tsx prisma/cadastra-contabeis.ts
 *
 * Os seletores foram conferidos contra o HTML real do site (jul/2026). Se o
 * Contábeis mudar de layout, ajuste em /admin/fontes com "Detectar seletores".
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const FONTE = {
  name: "Contábeis — Tributário",
  url: "https://www.contabeis.com.br/conteudo/tributario/",
  category: "PRIVADO" as const, // conteúdo tributário → setor privado
  itemSelector: "article.editoria-tributario",
  titleSelector: "h2",
  // O <a> envolve o título (<a><h2>…</h2></a>); "a" pega o link que embrulha o
  // item. O <base href> do site resolve o caminho relativo.
  linkSelector: "a",
  dateSelector: ".timestamp", // data relativa ("Ontem 09:00") — o parser entende
  imageSelector: "img",
  // A listagem não traz resumo; a importação gera um do corpo da matéria.
  excerptSelector: null,
  categorySelector: "strong", // rótulo "REFORMA TRIBUTÁRIA" etc. → vira tag
  contentSelector: "div.texto",
};

async function main() {
  const jaExiste = await prisma.scrapeSource.findFirst({
    where: { url: FONTE.url },
    select: { id: true },
  });

  // Upsert: se a fonte já existe (talvez criada pelo painel com seletores
  // vazios), ATUALIZA para os seletores certos; senão, cria. Idempotente.
  if (jaExiste) {
    await prisma.scrapeSource.update({ where: { id: jaExiste.id }, data: FONTE });
    console.log(`[contabeis] Fonte já existia — seletores atualizados (${jaExiste.id}).`);
  } else {
    const fonte = await prisma.scrapeSource.create({ data: FONTE });
    console.log(`[contabeis] Fonte criada: "${fonte.name}" (${fonte.id}).`);
  }
  console.log("[contabeis] Confira em /admin/fontes e teste em Buscar notícias.");
}

main()
  .catch((e) => {
    console.error("[contabeis] Falhou:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
