import type { Metadata } from "next";
import {
  PERIODOS,
  agoraNoSite,
  dispositivos,
  duracao,
  horarios,
  maisLidas,
  origens,
  pct,
  periodoDe,
  resumo,
  serie,
  temDados,
  variacao,
} from "@/lib/audiencia";
import AgoraNoSite from "@/components/admin/audiencia/AgoraNoSite";
import Cartao from "@/components/admin/audiencia/Cartao";
import ComecoAgora from "@/components/admin/audiencia/ComecoAgora";
import Contatos from "@/components/admin/audiencia/Contatos";
import Dispositivos from "@/components/admin/audiencia/Dispositivos";
import GraficoSerie from "@/components/admin/audiencia/GraficoSerie";
import Horarios from "@/components/admin/audiencia/Horarios";
import Kpi from "@/components/admin/audiencia/Kpi";
import MaisLidas from "@/components/admin/audiencia/MaisLidas";
import Origens from "@/components/admin/audiencia/Origens";
import PeriodoFiltro from "@/components/admin/audiencia/PeriodoFiltro";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Audiência" };

export default async function AudienciaPage({
  searchParams,
}: {
  searchParams: { p?: string };
}) {
  const periodo = periodoDe(searchParams.p);
  const [existe, agora] = await Promise.all([temDados(), agoraNoSite()]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-conplan">Audiência</h1>
          <p className="mt-1 text-sm text-slate-500">
            Quem lê o portal, o quê, de onde e quando.
          </p>
        </div>
        <AgoraNoSite inicial={agora} />
      </header>

      {existe ? (
        <PeriodoFiltro opcoes={PERIODOS} atual={periodo.chave}>
          <Painel periodo={periodo} />
        </PeriodoFiltro>
      ) : (
        <ComecoAgora />
      )}
    </div>
  );
}

async function Painel({ periodo }: { periodo: ReturnType<typeof periodoDe> }) {
  const [atual, anterior, pontos, fatias, horas, aparelhos, ranking] = await Promise.all([
    resumo(periodo.inicio, periodo.fim),
    resumo(periodo.anteriorInicio, periodo.anteriorFim),
    serie(periodo),
    origens(periodo.inicio, periodo.fim),
    horarios(periodo.inicio, periodo.fim),
    dispositivos(periodo.inicio, periodo.fim),
    maisLidas(periodo.inicio, periodo.fim),
  ]);

  const taxa = pct(atual.leituras, atual.acessosMaterias);

  return (
    <div className="mt-4 space-y-4 lg:space-y-6">
      <p className="text-xs text-slate-500">
        {periodo.titulo} · as setas comparam {periodo.comparacao.replace(/^vs\. /, "com ")}
      </p>

      {/* ——— Números do período ——— */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Kpi
          rotulo="Acessos"
          valor={atual.acessos}
          delta={variacao(atual.acessos, anterior.acessos)}
          comparacao={periodo.comparacao}
        />
        <Kpi
          rotulo="Visitantes"
          valor={atual.visitantes}
          delta={variacao(atual.visitantes, anterior.visitantes)}
          comparacao={periodo.comparacao}
        />
        <Kpi
          rotulo="Leituras"
          valor={atual.leituras}
          delta={variacao(atual.leituras, anterior.leituras)}
          comparacao={periodo.comparacao}
          detalhe={atual.acessosMaterias ? `${taxa}% leram` : undefined}
        />
        <Kpi
          rotulo="Tempo médio de leitura"
          valor={atual.tempoMedio}
          formato={duracao(atual.tempoMedio)}
          delta={variacao(atual.tempoMedio, anterior.tempoMedio)}
          comparacao={periodo.comparacao}
        />
      </div>

      {/* ——— Evolução ——— */}
      <Cartao
        titulo={periodo.porHora ? "Acessos por hora" : "Acessos por dia"}
        subtitulo="Passe o dedo ou o mouse no gráfico para ver cada ponto"
      >
        <GraficoSerie pontos={pontos} unidade={periodo.porHora ? "hora" : "dia"} />
      </Cartao>

      <div className="grid gap-4 lg:grid-cols-12 lg:items-start lg:gap-6">
        <Cartao
          titulo="Mais lidas"
          subtitulo="Pela quantidade de leituras — quem chegou ao fim do texto"
          className="lg:col-span-7"
        >
          <MaisLidas itens={ranking} />
        </Cartao>

        <div className="space-y-4 lg:col-span-5 lg:space-y-6">
          <Cartao titulo="De onde vêm os leitores">
            <Origens fatias={fatias} />
          </Cartao>
          <Cartao titulo="Celular ou computador">
            <Dispositivos {...aparelhos} />
          </Cartao>
        </div>

        <Cartao titulo="Melhor horário para compartilhar" className="lg:col-span-7">
          <Horarios horas={horas} />
        </Cartao>

        <Cartao
          titulo="Compartilhamentos e contatos"
          subtitulo="O que a leitura virou"
          className="lg:col-span-5"
        >
          <Contatos atual={atual} anterior={anterior} comparacao={periodo.comparacao} />
        </Cartao>
      </div>

      <p className="flex items-start gap-2 px-1 text-[11px] leading-relaxed text-slate-400">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-px shrink-0" aria-hidden="true">
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
        <span>
          Medição própria do portal: sem cookies e sem guardar IP. Leitura = chegou a 75% do texto
          e ficou 10 segundos ou mais. Visitantes são contados por dia (a mesma pessoa em dois dias
          conta duas vezes). Suas visitas com o painel aberto neste navegador não entram na conta.
        </span>
      </p>
    </div>
  );
}
