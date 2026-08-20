import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/site";
import { toEmbedUrl } from "@/lib/embed";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ApprovalsShowcase, { type ApprovalItem } from "@/components/ApprovalsShowcase";

// A vitrine muda conforme o painel; página sempre fresca.
export const dynamic = "force-dynamic";

const PREVIEW = `${SITE_URL}/preview_conplan.png`;
const TITULO = "Contas Aprovadas — CONPLAN";
const DESC =
  "Municípios com contas aprovadas pelo TCE-PI, com a assessoria da CONPLAN — Grupo Dr. Marconi Nunes.";

// A imagem do card compartilhado no WhatsApp é a logo da CONPLAN.
export const metadata: Metadata = {
  title: TITULO,
  description: DESC,
  alternates: { canonical: "/contas-aprovadas" },
  openGraph: {
    title: TITULO,
    description: DESC,
    url: "/contas-aprovadas",
    type: "website",
    images: [PREVIEW],
  },
  twitter: { card: "summary_large_image", title: TITULO, description: DESC, images: [PREVIEW] },
};

export default async function ContasAprovadasPage() {
  let approvals: ApprovalItem[] = [];
  try {
    const rows = await prisma.approval.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      take: 40,
      select: { id: true, municipality: true, label: true, embedUrl: true },
    });
    // Só os que têm vídeo reconhecível — o card É a publicação.
    approvals = rows.filter((a) => toEmbedUrl(a.embedUrl));
  } catch (e) {
    console.error("[contas-aprovadas] falha ao listar:", e);
  }

  return (
    <>
      <Header />
      <main>
        {/* Hero escuro — o header é transparente e precisa de fundo escuro atrás. */}
        <section className="bg-conplan pt-28 pb-12 sm:pt-32 sm:pb-14">
          <div className="section-shell">
            <span className="kicker text-marconi-light">
              <span className="h-px w-6 bg-marconi-light/50" />
              CONPLAN · Gestão Pública
            </span>
            <h1 className="mt-3 font-serif text-3xl font-semibold text-white sm:text-4xl">
              Contas Aprovadas
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
              Municípios com contas aprovadas pelo Tribunal de Contas do Estado
              do Piauí (TCE-PI), com a assessoria da CONPLAN — Grupo Dr. Marconi
              Nunes.
            </p>
          </div>
        </section>

        {approvals.length > 0 ? (
          <ApprovalsShowcase items={approvals} />
        ) : (
          <section className="bg-cloud py-16">
            <div className="section-shell text-center text-sm text-slate-500">
              Em breve, os municípios com contas aprovadas aparecem aqui.
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
