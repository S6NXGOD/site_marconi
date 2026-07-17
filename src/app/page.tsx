import Header from "@/components/Header";
import NewsPortal, { type NewsItem } from "@/components/NewsPortal";
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
import { prisma } from "@/lib/prisma";
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
async function getPortalData(): Promise<{
  news: NewsItem[];
  alerts: AlertItem[];
  encerrados: AlertItem[];
  approvals: ApprovalItem[];
}> {
  try {
    const [news, alerts, encerrados, approvals] = await Promise.all([
      prisma.news.findMany({
        where: { isPublished: true },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        take: 9,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          content: true,
          coverImage: true,
          category: true,
          publishedAt: true,
        },
      }),
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
      alerts,
      encerrados,
      // O card É a publicação incorporada: sem link válido não há o que exibir.
      // Filtrado aqui (e não no cliente) para não enviar dados inúteis ao browser.
      approvals: approvals.filter((a) => toEmbedUrl(a.embedUrl)),
    };
  } catch (error) {
    // O site continua no ar com as seções institucionais; o portal fica vazio.
    console.error("[home] falha ao carregar dados do portal:", error);
    return { news: [], alerts: [], encerrados: [], approvals: [] };
  }
}

export default async function Home() {
  const [{ news, alerts, encerrados, approvals }, whatsapp, areas] = await Promise.all([
    getPortalData(),
    getWhatsappContacts(),
    getBusinessAreas(),
  ]);

  return (
    <>
      <Header />
      <main>
        {/* Topo em formato de Portal: notícias + alertas/prazos */}
        <NewsPortal news={news} alerts={alerts} encerrados={encerrados} />

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
