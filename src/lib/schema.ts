import { SITE_URL, SITE_NAME } from "@/lib/site";

/**
 * Dados estruturados (schema.org / JSON-LD).
 *
 * Só declaramos o que é verdade e está publicado no site: nome, e-mail, logo e
 * atuação. Endereço e telefone NÃO entram enquanto não forem divulgados —
 * dado inventado em schema é pior que schema ausente (o Google cruza com outras
 * fontes e perde confiança no site).
 */

export const EMAIL_INSTITUCIONAL = "contato@marconinunes.com.br";

const DESCRICAO =
  "Grupo Dr. Marconi Nunes: CONPLAN — assessoria e consultoria a prefeituras e municípios — e Marconi Nunes Contabilidade, atuando nas áreas Fiscal e Tributária, Contábil, RH e Departamento Pessoal, e Societária e Legalização.";

/** A organização por trás do site — usada em todas as páginas. */
export function organizacaoSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organizacao`,
    name: SITE_NAME,
    alternateName: ["Marconi Nunes Contabilidade", "CONPLAN"],
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/icon-512.png`,
      width: 512,
      height: 512,
    },
    image: `${SITE_URL}/og.png`,
    email: EMAIL_INSTITUCIONAL,
    description: DESCRICAO,
    areaServed: [
      { "@type": "State", name: "Piauí" },
      { "@type": "Country", name: "Brasil" },
    ],
    knowsAbout: [
      "Contabilidade pública",
      "Gestão pública municipal",
      "Prestação de contas",
      "Contabilidade empresarial",
      "Área fiscal e tributária",
      "Departamento pessoal",
      "Societária e legalização",
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: EMAIL_INSTITUCIONAL,
        availableLanguage: ["Portuguese"],
      },
    ],
  };
}

/**
 * O site em si. O `SearchAction` aponta para a busca real de notícias
 * (`/noticias?q=`) — é o que habilita a caixa de pesquisa nos resultados.
 */
export function siteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#site`,
    name: `Portal ${SITE_NAME}`,
    alternateName: SITE_NAME,
    url: SITE_URL,
    inLanguage: "pt-BR",
    description: DESCRICAO,
    publisher: { "@id": `${SITE_URL}/#organizacao` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/noticias?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** Trilha de navegação — ajuda o Google a montar o caminho no resultado. */
export function breadcrumbSchema(
  itens: Array<{ nome: string; url: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: itens.map((item, indice) => ({
      "@type": "ListItem",
      position: indice + 1,
      name: item.nome,
      item: item.url,
    })),
  };
}

/** Notícia publicada no portal. */
export function noticiaSchema(noticia: {
  titulo: string;
  descricao?: string | null;
  url: string;
  imagem?: string | null;
  publicadoEm?: Date | null;
  atualizadoEm?: Date | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: noticia.titulo.slice(0, 110),
    description: noticia.descricao ?? undefined,
    url: noticia.url,
    mainEntityOfPage: { "@type": "WebPage", "@id": noticia.url },
    image: noticia.imagem ? [noticia.imagem] : [`${SITE_URL}/og.png`],
    datePublished: noticia.publicadoEm?.toISOString(),
    dateModified: (noticia.atualizadoEm ?? noticia.publicadoEm)?.toISOString(),
    inLanguage: "pt-BR",
    isAccessibleForFree: true,
    author: { "@id": `${SITE_URL}/#organizacao` },
    publisher: { "@id": `${SITE_URL}/#organizacao` },
  };
}
