import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { AlertCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/site";
import { inicioDeHoje } from "@/lib/datas";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AlertsPanel from "@/components/AlertsPanel";

// Os prazos mudam; a página é sempre fresca.
export const dynamic = "force-dynamic";

type SetorKey = "publico" | "privado";

const SETORES: Record<
  SetorKey,
  { category: AlertCategory; label: string; preview: string }
> = {
  publico: {
    category: "PUBLICO",
    label: "Gestão Pública",
    preview: "/preview_marconi_publico.png",
  },
  privado: {
    category: "PRIVADO",
    label: "Setor Privado",
    preview: "/preview_marconi_privado.png",
  },
};

function setorDe(param: string): (typeof SETORES)[SetorKey] | null {
  return param === "publico" || param === "privado" ? SETORES[param] : null;
}

/**
 * A imagem do preview (og:image) muda por setor: é ela que o WhatsApp mostra no
 * card do link compartilhado — a logo pública ou a privada, conforme o prazo.
 */
export async function generateMetadata({
  params,
}: {
  params: { setor: string };
}): Promise<Metadata> {
  const s = setorDe(params.setor);
  if (!s) return { title: "Prazos não encontrados" };

  const titulo = `Prazos e obrigações — ${s.label}`;
  const descricao = `Calendário de prazos e obrigações do ${s.label}, do Grupo Dr. Marconi Nunes.`;
  const imagem = `${SITE_URL}${s.preview}`;

  return {
    title: titulo,
    description: descricao,
    alternates: { canonical: `/prazos/${params.setor}` },
    openGraph: {
      title: titulo,
      description: descricao,
      url: `/prazos/${params.setor}`,
      type: "website",
      images: [imagem],
    },
    twitter: { card: "summary_large_image", title: titulo, description: descricao, images: [imagem] },
  };
}

const selectAlert = {
  id: true,
  title: true,
  date: true,
  category: true,
  description: true,
} as const;

export default async function PrazosSetorPage({
  params,
}: {
  params: { setor: string };
}) {
  const s = setorDe(params.setor);
  if (!s) notFound();

  const hoje = inicioDeHoje();
  const [alerts, encerrados] = await Promise.all([
    prisma.alert.findMany({
      where: { isActive: true, category: s.category, date: { gte: hoje } },
      orderBy: { date: "asc" },
      take: 40,
      select: selectAlert,
    }),
    prisma.alert.findMany({
      where: { isActive: true, category: s.category, date: { lt: hoje } },
      orderBy: { date: "desc" },
      take: 12,
      select: selectAlert,
    }),
  ]);

  return (
    <>
      <Header />

      <main>
        {/* Hero escuro — o header é transparente e precisa de fundo escuro
            atrás para as logos e o menu (brancos) ficarem legíveis. */}
        <section className="bg-conplan pt-28 pb-12 sm:pt-32 sm:pb-14">
          <div className="section-shell">
            <span className="kicker text-marconi-light">
              <span className="h-px w-6 bg-marconi-light/50" />
              Portal do Grupo
            </span>
            <h1 className="mt-3 font-serif text-3xl font-semibold text-white sm:text-4xl">
              Prazos &amp; Obrigações
            </h1>
            <p className="mt-2 text-sm text-slate-300 sm:text-base">
              Calendário de obrigações do{" "}
              <strong className="font-semibold text-marconi-light">{s.label}</strong> — prefeituras e
              clientes corporativos do Grupo Dr. Marconi Nunes.
            </p>
          </div>
        </section>

        {/* Lista em fundo claro */}
        <section className="bg-cloud py-10 sm:py-14">
          <div className="section-shell mx-auto max-w-2xl">
            <AlertsPanel alerts={alerts} encerrados={encerrados} />

            <p className="mt-6 text-center text-sm text-slate-500">
              <a href="/#alertas" className="font-semibold text-marconi transition-colors hover:text-marconi-dark">
                Ver todos os prazos no portal →
              </a>
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
