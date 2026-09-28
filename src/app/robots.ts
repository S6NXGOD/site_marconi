import type { MetadataRoute } from "next";
import { SITE_URL, IS_INDEXABLE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  // Em preview/dev, bloqueia tudo — o domínio temporário do Railway não deve
  // competir com o domínio oficial nos buscadores (conteúdo duplicado).
  if (!IS_INDEXABLE) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [
      {
        userAgent: "*",
        // /api/uploads/ serve as imagens das notícias (capa = og:image) e
        // PRECISA ficar liberado: o robô do WhatsApp/Facebook respeita o
        // robots.txt ao buscar a imagem do card, e com ela bloqueada o link
        // compartilhado chegava sem título, resumo nem foto. Vale a regra mais
        // longa, então este Allow vence o `Disallow: /api/` só nesta pasta.
        allow: ["/", "/api/uploads/"],
        // Painel, autenticação e as demais rotas da API ficam fora do índice.
        disallow: ["/admin", "/admin/", "/login", "/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
