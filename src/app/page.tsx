import Header from "@/components/Header";
import NewsPortal, {
  type NewsItem,
  type NoticiasPorFiltro,
} from "@/components/NewsPortal";
import { type AlertItem } from "@/components/AlertsPanel";
import BusinessAreas from "@/components/BusinessAreas";
import ResultsCounters from "@/components/ResultsCounters";
import ApprovalsShowcase, {
  type ApprovalItem,
} from "@/components/ApprovalsShowcase";
import FounderSection from "@/components/FounderSection";
import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";
import DeadlineFloat from "@/components/DeadlineFloat";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { Prisma, type NewsCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resumoExibicao } from "@/lib/resumo";
import { inicioDeHoje } from "@/lib/datas";
import { toEmbedUrl } from "@/lib/embed";
import { getWhatsappContacts, getBusinessAreas } from "@/lib/content";

// Renderiza a cada requisição — conteúdo do portal é dinâmico.
export const dynamic = "force-dynamic";

/**
 * Conteúdo do portal.
 * IMPORTANTE: nunca inventar conteúdo. Se não há notícia publicada — ou se o
 * banco falhar — as seções mostram estado vazio ou somem. Publicar notícia
 * fictícia num site institucional seria pior do que não mostrar nada.
 */
const selectNews = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  content: true,
  coverImage: true,
  category: true,
  publishedAt: true,
} as const;

const CATEGORIAS: NewsCategory[] = ["PUBLICO", "PRIVADO", "GERAL"];

/**
 * Monta o item que vai ao browser.
 *
 * O resumo é calculado AQUI: o corpo da matéria (HTML inteiro) servia só para
 * isso e não tem por que trafegar — são poucos caracteres no lugar de artigos
 * completos, vezes cada notícia da home.
 */
function paraItem(n: {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  category: NewsCategory;
  publishedAt: Date;
}): NewsItem {
  return {
    id: n.id,
    title: n.title,
    slug: n.slug,
    summary: resumoExibicao(n.excerpt, n.content, 180),
    coverImage: n.coverImage,
    category: n.category,
    publishedAt: n.publishedAt,
  };
}

/**
 * Uma lista por aba — "Todas" e cada categoria com a SUA consulta.
 *
 * Antes buscava-se só as N mais recentes no geral e a aba filtrava esse punhado
 * no cliente: bastava as últimas publicadas serem todas de um setor para as
 * outras abas mostrarem "nenhuma notícia nesta categoria" mesmo havendo várias.
 */
async function noticiasPorFiltro(
  ordem: "publishedAt" | "createdAt",
  take: number
): Promise<NoticiasPorFiltro> {
  // Destaques seguem a data EDITORIAL; "Mais notícias", a de CADASTRO.
  const orderBy: Prisma.NewsOrderByWithRelationInput[] =
    ordem === "publishedAt"
      ? [{ publishedAt: "desc" }, { createdAt: "desc" }]
      : [{ createdAt: "desc" }];

  const consultar = (category?: NewsCategory) =>
    prisma.news.findMany({
      where: { isPublished: true, ...(category ? { category } : {}) },
      orderBy,
      take,
      select: selectNews,
    });

  const [todas, publico, privado, geral] = await Promise.all([
    consultar(),
    ...CATEGORIAS.map((c) => consultar(c)),
  ]);

  return {
    ALL: todas.map(paraItem),
    PUBLICO: publico.map(paraItem),
    PRIVADO: privado.map(paraItem),
    GERAL: geral.map(paraItem),
  };
}

/** Home sem nenhuma notícia — usado quando o banco falha. */
const SEM_NOTICIAS: NoticiasPorFiltro = {
  ALL: [],
  PUBLICO: [],
  PRIVADO: [],
  GERAL: [],
};

async function getPortalData(): Promise<{
  news: NoticiasPorFiltro;
  ultimas: NoticiasPorFiltro;
  alerts: AlertItem[];
  encerrados: AlertItem[];
  approvals: ApprovalItem[];
}> {
  try {
    const [news, ultimas, alerts, encerrados, approvals] = await Promise.all([
      // Destaques: pela data EDITORIAL (publishedAt) — a manchete é a mais
      // recente do ponto de vista jornalístico. A grade usa 3 (manchete + 2).
      noticiasPorFiltro("publishedAt", 3),
      // "Mais notícias": pela ordem de CADASTRO (createdAt) — as últimas que
      // entraram no sistema, independentemente da data editorial. É o que faz
      // esta lista não depender da grade de destaques.
      noticiasPorFiltro("createdAt", 12),
      prisma.alert.findMany({
        // Só prazos ativos e ainda não vencidos (inclui os que vencem hoje).
        where: { isActive: true, date: { gte: inicioDeHoje() } },
        orderBy: { date: "asc" },
        take: 12,
        select: {
          id: true,
          title: true,
          date: true,
          category: true,
          description: true,
        },
      }),
      prisma.alert.findMany({
        // Prazos que já passaram — a aba "Encerrados" do painel.
        // Teto baixo de propósito: é consulta de referência, não a lista
        // principal, e vai inteira no payload da home.
        where: { isActive: true, date: { lt: inicioDeHoje() } },
        orderBy: { date: "desc" },
        take: 8,
        select: {
          id: true,
          title: true,
          date: true,
          category: true,
          description: true,
        },
      }),
      prisma.approval.findMany({
        where: { isActive: true },
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        take: 12,
        select: {
          id: true,
          municipality: true,
          label: true,
          embedUrl: true,
        },
      }),
    ]);

    return {
      news,
      ultimas,
      alerts,
      encerrados,
      // O card É a publicação incorporada: sem link válido não há o que exibir.
      // Filtrado aqui (e não no cliente) para não enviar dados inúteis ao browser.
      approvals: approvals.filter((a) => toEmbedUrl(a.embedUrl)),
    };
  } catch (error) {
    // O site continua no ar com as seções institucionais; o portal fica vazio.
    console.error("[home] falha ao carregar dados do portal:", error);
    return {
      news: SEM_NOTICIAS,
      ultimas: SEM_NOTICIAS,
      alerts: [],
      encerrados: [],
      approvals: [],
    };
  }
}

export default async function Home() {
  const [{ news, ultimas, alerts, encerrados, approvals }, whatsapp, areas] = await Promise.all([
    getPortalData(),
    getWhatsappContacts(),
    getBusinessAreas(),
  ]);

  return (
    <>
      <Header />
      <main>
        {/* Topo em formato de Portal: notícias + alertas/prazos */}
        <NewsPortal news={news} ultimas={ultimas} alerts={alerts} encerrados={encerrados} />

        {/* Apresentação unificada das duas empresas */}
        <BusinessAreas areas={areas} />

        {/* Sobre o fundador — logo após as áreas de atuação */}
        <FounderSection />

        {/* Resultados / prova social */}
        <ResultsCounters />

        {/* Reels de Contas Aprovadas — some sozinho se não houver nenhum */}
        <ApprovalsShowcase items={approvals} />

        {/* Captação de leads (grava em CommercialLead) */}
        <ContactForm whatsapp={whatsapp[0]?.phone} />
      </main>

      {/* Flutuantes: prazos (esquerda) e WhatsApp (direita) */}
      <DeadlineFloat alerts={alerts} />
      <WhatsAppFloat contacts={whatsapp} />

      <Footer />
    </>
  );
}
