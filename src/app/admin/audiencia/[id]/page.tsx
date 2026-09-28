import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { categoryBadgeClasses, categoryLabels } from "@/lib/news";
import { formatarDataCurta } from "@/lib/datas";
import { resumoExibicao } from "@/lib/resumo";
import { comVia, mensagemDaNoticia } from "@/lib/share";
import { SITE_URL } from "@/lib/site";
import {
  dispositivos,
  duracao,
  origens,
  pct,
  periodoDaNoticia,
  resumo,
  serie,
} from "@/lib/audiencia";
import Cartao from "@/components/admin/audiencia/Cartao";
import Dispositivos from "@/components/admin/audiencia/Dispositivos";
import GraficoSerie from "@/components/admin/audiencia/GraficoSerie";
import Kpi from "@/components/admin/audiencia/Kpi";
import Origens from "@/components/admin/audiencia/Origens";
import ShareNewsButton from "@/components/admin/ShareNewsButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Audiência da matéria" };

/**
 * Audiência de UMA matéria: a curva desde o primeiro acesso, se foi lida, de
 * onde vieram os leitores — e o botão de compartilhar à mão, para reenviar a
 * que está rendendo.
 */
export default async function AudienciaNoticiaPage({ params }: { params: { id: string } }) {
  const noticia = await prisma.news.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      category: true,
      isPublished: true,
      publishedAt: true,
    },
  });
  if (!noticia) notFound();

  const primeira = await prisma.pageView.findFirst({
    where: { newsId: noticia.id },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });
  const periodo = periodoDaNoticia(primeira?.createdAt ?? null);

  const [total, pontos, fatias, aparelhos] = await Promise.all([
    resumo(periodo.inicio, periodo.fim, noticia.id),
    serie(periodo, noticia.id),
    origens(periodo.inicio, periodo.fim, noticia.id),
    dispositivos(periodo.inicio, periodo.fim, noticia.id),
  ]);

  const url = `${SITE_URL}/noticias/${noticia.slug}`;
  const mensagem = mensagemDaNoticia({
    title: noticia.title,
    summary: resumoExibicao(noticia.excerpt, noticia.content, 220),
    url: comVia(url, "whatsapp"),
  });

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/audiencia"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-conplan"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
          Audiência
        </Link>

        <h1 className="mt-3 text-xl font-semibold leading-snug text-conplan sm:text-2xl">
          {noticia.title}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${categoryBadgeClasses[noticia.category]}`}>
            {categoryLabels[noticia.category]}
          </span>
          <span className="text-xs text-slate-500">
            {noticia.isPublished
              ? `Publicada em ${formatarDataCurta(noticia.publishedAt)}`
              : "Rascunho — fora do site"}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-1">
          {noticia.isPublished && (
            <>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-conplan transition-colors hover:bg-conplan-soft"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M7 17L17 7M9 7h8v8" />
                </svg>
                Ver no site
              </a>
              <ShareNewsButton mensagem={mensagem} />
            </>
          )}
          <Link
            href={`/admin/noticias/${noticia.id}/editar`}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-conplan transition-colors hover:bg-conplan-soft"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
            </svg>
            Editar
          </Link>
        </div>
      </div>

      {total.acessos === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center text-sm text-slate-400 shadow-sm">
          {noticia.isPublished
            ? "Ninguém abriu esta matéria ainda. Que tal compartilhar?"
            : "Rascunho: a matéria só começa a contar depois de publicada."}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <Kpi rotulo="Acessos" valor={total.acessos} detalhe={`${total.visitantes.toLocaleString("pt-BR")} visitantes`} />
            <Kpi
              rotulo="Leituras"
              valor={total.leituras}
              detalhe={`${pct(total.leituras, total.acessos)}% leram`}
            />
            <Kpi rotulo="Tempo médio de leitura" valor={total.tempoMedio} formato={duracao(total.tempoMedio)} />
            <Kpi rotulo="Compartilhamentos" valor={total.compartilhamentos} />
          </div>

          <Cartao titulo="Acessos por dia" subtitulo={periodo.titulo}>
            <GraficoSerie pontos={pontos} />
          </Cartao>

          <div className="grid gap-4 lg:grid-cols-3 lg:items-start lg:gap-6">
            <Cartao titulo="De onde vieram os leitores" className="lg:col-span-2">
              <Origens fatias={fatias} />
            </Cartao>
            <Cartao titulo="Celular ou computador">
              <Dispositivos {...aparelhos} />
            </Cartao>
          </div>
        </>
      )}
    </div>
  );
}
