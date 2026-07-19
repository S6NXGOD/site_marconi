import { prisma } from "./prisma";

/** Tag com quantas notícias a usam — a base de tudo que é "gestão". */
export type TagRank = { name: string; count: number };
export type TagGerencia = {
  id: string;
  name: string;
  slug: string;
  count: number;
  createdAt: Date;
};

/**
 * Tags para sugerir no campo da notícia, RANQUEADAS por uso (as mais usadas
 * primeiro). O contador acompanha a sugestão para dar contexto de peso.
 */
export async function getTagSuggestions(): Promise<TagRank[]> {
  const tags = await prisma.tag.findMany({
    select: { name: true, _count: { select: { news: true } } },
  });
  return tags
    .map((t) => ({ name: t.name, count: t._count.news }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "pt-BR"));
}

/**
 * Todas as tags com contagem de uso e data — para a Central de Assuntos
 * (renomear, mesclar, excluir, ver o que virou lixo).
 */
export async function getTagsComContagem(): Promise<TagGerencia[]> {
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
      _count: { select: { news: true } },
    },
  });
  return tags.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    count: t._count.news,
    createdAt: t.createdAt,
  }));
}
