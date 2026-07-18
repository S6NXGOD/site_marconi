import { prisma } from "./prisma";

/** Nomes de todas as tags existentes, para sugerir no formulário. */
export async function getTagSuggestions(): Promise<string[]> {
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    select: { name: true },
  });
  return tags.map((t) => t.name);
}
