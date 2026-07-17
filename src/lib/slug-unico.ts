import { prisma } from "./prisma";
import { slugify, slugOtimizado } from "./slugify";

/**
 * Garante que o slug não colide com outra notícia, sufixando -2, -3...
 *
 * Vive aqui, e não em admin/actions.ts, porque a importação também precisa
 * dele: naquele arquivo tudo é `"use server"`, e exportar a função de lá a
 * transformaria numa server action — um endpoint público — em vez de uma
 * função interna.
 */
export async function slugUnico(base: string, ignoreId?: string): Promise<string> {
  const raiz = slugify(base) || "noticia";
  let slug = raiz;
  let i = 2;
  for (;;) {
    const existe = await prisma.news.findUnique({ where: { slug } });
    if (!existe || existe.id === ignoreId) return slug;
    slug = `${raiz}-${i++}`;
  }
}

/**
 * Slug final da notícia.
 *
 * O que a pessoa digitou tem prioridade (só normalizado). Vazio, sai do
 * título já enxuto — sem stopwords e no limite de caracteres.
 */
export function slugDaNoticia(slugInput: string, title: string): string {
  return slugInput ? slugify(slugInput) : slugOtimizado(title);
}
