/**
 * Converte capas de notícia em formatos que os previews de link não exibem.
 *
 * O WhatsApp não renderiza WebP (nem AVIF) no card do link: a matéria é
 * compartilhada sem imagem. O navegador exibe esses formatos numa boa, então
 * o problema passa despercebido no site e só aparece na hora de compartilhar.
 *
 * Desde que os uploads passam pelo `otimizarImagem`, toda capa nova já nasce
 * jpg ou png. Isto existe para as capas enviadas antes disso — e é o mesmo
 * motivo de rodar no boot: o arquivo está no volume de produção, fora do
 * alcance de qualquer correção feita na máquina de quem desenvolve.
 *
 * Idempotente: sem capa fora do padrão, não faz nada.
 */
import { PrismaClient } from "@prisma/client";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { otimizarImagem } from "../src/lib/image-pipeline";
import { UPLOAD_DIR, isSafeUploadName } from "../src/lib/uploads";

/** Formatos que WhatsApp, Facebook e LinkedIn exibem no card. */
const OK = [".jpg", ".jpeg", ".png"];

const PREFIXO = "/api/uploads/";

export async function normalizarCapas(prisma: PrismaClient) {
  const noticias = await prisma.news.findMany({
    where: { coverImage: { not: null } },
    select: { id: true, slug: true, coverImage: true },
  });

  const alvos = noticias.filter((n) => {
    const cover = n.coverImage ?? "";
    // Capa externa (http) não é nossa para converter.
    if (!cover.startsWith(PREFIXO)) return false;
    return !OK.some((ext) => cover.toLowerCase().endsWith(ext));
  });

  if (alvos.length === 0) return;

  console.log(`[capas] ${alvos.length} capa(s) em formato sem preview — convertendo`);

  for (const noticia of alvos) {
    const nomeAtual = (noticia.coverImage ?? "").slice(PREFIXO.length);
    if (!isSafeUploadName(nomeAtual)) {
      console.warn(`[capas] nome suspeito, ignorado: ${nomeAtual}`);
      continue;
    }

    try {
      const original = await readFile(path.join(UPLOAD_DIR, nomeAtual));
      const otimizada = await otimizarImagem(original);

      // Nome novo, arquivo novo: o antigo pode estar no cache do WhatsApp e de
      // quem já abriu a página. Reaproveitar o nome serviria conteúdo trocado
      // sob uma URL marcada como `immutable`.
      const nomeNovo = `${nomeAtual.replace(/\.[^.]+$/, "")}.${otimizada.ext}`;
      await writeFile(path.join(UPLOAD_DIR, nomeNovo), otimizada.buffer);

      await prisma.news.update({
        where: { id: noticia.id },
        data: { coverImage: `${PREFIXO}${nomeNovo}` },
      });

      console.log(`[capas] ${noticia.slug.slice(0, 40)}: ${nomeAtual} -> ${nomeNovo}`);
    } catch (erro) {
      // Arquivo sumido ou ilegível não pode derrubar o boot: a notícia
      // continua no ar, só sem imagem no preview — como já estava.
      console.warn(`[capas] falhou em ${nomeAtual}:`, (erro as Error).message);
    }
  }
}

// Executado direto (npm run db:capas) — no boot, o seed chama a função.
if (require.main === module) {
  const prisma = new PrismaClient();
  normalizarCapas(prisma)
    .catch((e) => console.error("[capas] erro:", e))
    .finally(() => prisma.$disconnect());
}
