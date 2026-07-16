import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const estaticas: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    {
      url: `${SITE_URL}/noticias`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  try {
    const noticias = await prisma.news.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      select: { slug: true, updatedAt: true },
      take: 1000,
    });

    return [
      ...estaticas,
      ...noticias.map((n) => ({
        url: `${SITE_URL}/noticias/${n.slug}`,
        lastModified: n.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
    ];
  } catch (error) {
    // Banco fora do ar não pode quebrar o sitemap inteiro.
    console.error("[sitemap] falha ao listar notícias:", error);
    return estaticas;
  }
}
