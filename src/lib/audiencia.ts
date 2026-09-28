import "server-only";
import { Prisma, type NewsCategory } from "@prisma/client";
import { prisma } from "./prisma";
import { hojeISO } from "./datas";
import { ORIGENS, type Origem } from "./pulso";

/**
 * Consultas da área "Audiência" do painel (os dados vêm de PageView/ClickEvent,
 * gravados por /api/pulso).
 *
 * Datas: o banco guarda UTC; dia e hora são contados no fuso do Piauí
 * (America/Fortaleza, UTC-3 o ano todo, sem horário de verão). No SQL, a
 * conversão é explícita — não depende do fuso configurado no Postgres.
 */

const DIA_MS = 86_400_000;
const FUSO_MS = 3 * 60 * 60 * 1000;

export const PERIODOS = [
  { chave: "hoje", rotulo: "Hoje", dias: 1 },
  { chave: "7", rotulo: "7 dias", dias: 7 },
  { chave: "30", rotulo: "30 dias", dias: 30 },
  { chave: "90", rotulo: "90 dias", dias: 90 },
] as const;
export type ChavePeriodo = (typeof PERIODOS)[number]["chave"];

export type Periodo = {
  chave: ChavePeriodo | "noticia";
  /** "Últimos 7 dias" */
  titulo: string;
  /** "vs. os 7 dias anteriores" — o que o delta compara */
  comparacao: string;
  inicio: Date;
  fim: Date;
  anteriorInicio: Date;
  anteriorFim: Date;
  /** "Hoje" mostra a evolução por hora; os demais, por dia. */
  porHora: boolean;
};

/** Meia-noite no Piauí do dia `iso` (yyyy-mm-dd), como instante UTC. */
function meiaNoite(iso: string): Date {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + FUSO_MS);
}

/** Dia (yyyy-mm-dd) no Piauí de um instante. */
function diaLocal(d: Date): string {
  return new Date(d.getTime() - FUSO_MS).toISOString().slice(0, 10);
}

export function periodoDe(bruto: string | undefined): Periodo {
  const p = PERIODOS.find((x) => x.chave === bruto) ?? PERIODOS[1];
  const fim = new Date();
  const inicio = new Date(meiaNoite(hojeISO()).getTime() - (p.dias - 1) * DIA_MS);
  // Mesmo trecho, N dias antes: "hoje até agora" compara com "ontem até esta
  // hora", e não com o dia de ontem inteiro — senão hoje sempre perde.
  const recuo = p.dias * DIA_MS;
  return {
    chave: p.chave,
    titulo: p.chave === "hoje" ? "Hoje" : `Últimos ${p.dias} dias`,
    comparacao: p.chave === "hoje" ? "vs. ontem até esta hora" : `vs. os ${p.dias} dias anteriores`,
    inicio,
    fim,
    anteriorInicio: new Date(inicio.getTime() - recuo),
    anteriorFim: new Date(fim.getTime() - recuo),
    porHora: p.chave === "hoje",
  };
}

/**
 * Período de UMA matéria: do dia do primeiro acesso até agora (no máximo 90
 * dias). É a curva que interessa numa notícia — o pico da estreia e quanto
 * ela ainda rende depois. Começa no primeiro acesso, não na data editorial: a
 * importada pode ter data de dias antes de entrar no portal.
 */
export function periodoDaNoticia(primeiroAcesso: Date | null): Periodo {
  const fim = new Date();
  const hoje = meiaNoite(hojeISO()).getTime();
  const desde = primeiroAcesso ? meiaNoite(diaLocal(primeiroAcesso)).getTime() : hoje;
  const inicio = new Date(Math.min(Math.max(desde, hoje - 89 * DIA_MS), hoje));
  return {
    chave: "noticia",
    titulo: "Desde a publicação",
    comparacao: "",
    inicio,
    fim,
    anteriorInicio: inicio,
    anteriorFim: inicio,
    porHora: false,
  };
}

/** Instante no formato da coluna (timestamp sem fuso, em UTC). */
function ts(d: Date): string {
  return d.toISOString().replace("T", " ").replace("Z", "");
}

/** Filtro de período para as consultas em SQL. */
function entre(inicio: Date, fim: Date) {
  return Prisma.sql`"createdAt" >= ${ts(inicio)}::timestamp AND "createdAt" < ${ts(fim)}::timestamp`;
}

const LOCAL = Prisma.sql`(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'America/Fortaleza')`;

// ——— Resumo (os números do topo) ———

export type Resumo = {
  acessos: number;
  visitantes: number;
  leituras: number;
  /** acessos a matérias — base da taxa de leitura */
  acessosMaterias: number;
  /** segundos médios numa matéria (0 sem dado) */
  tempoMedio: number;
  compartilhamentos: number;
  contatosWhatsapp: number;
  cliquesEspecialista: number;
  leads: number;
};

type LinhaResumo = {
  acessos: bigint;
  visitantes: bigint;
  leituras: bigint;
  materias: bigint;
  tempo: number | null;
};

export async function resumo(inicio: Date, fim: Date, newsId?: string): Promise<Resumo> {
  const daNoticia = newsId ? Prisma.sql`AND "newsId" = ${newsId}` : Prisma.empty;
  const onde = { createdAt: { gte: inicio, lt: fim }, ...(newsId ? { newsId } : {}) };

  const [[linha], cliques, leads] = await Promise.all([
    prisma.$queryRaw<LinhaResumo[]>`
      SELECT count(*) AS acessos,
             count(DISTINCT visitor) AS visitantes,
             count(*) FILTER (WHERE "read") AS leituras,
             count(*) FILTER (WHERE "newsId" IS NOT NULL) AS materias,
             avg(seconds) FILTER (WHERE "newsId" IS NOT NULL AND seconds > 0)::float8 AS tempo
      FROM "PageView"
      WHERE ${entre(inicio, fim)} ${daNoticia}`,
    prisma.clickEvent.groupBy({ by: ["kind"], where: onde, _count: { _all: true } }),
    // Leads do formulário não têm notícia: só contam no geral.
    newsId ? Promise.resolve(0) : prisma.commercialLead.count({ where: { createdAt: { gte: inicio, lt: fim } } }),
  ]);

  const clique = (k: string) => cliques.find((c) => c.kind === k)?._count._all ?? 0;

  return {
    acessos: Number(linha?.acessos ?? 0),
    visitantes: Number(linha?.visitantes ?? 0),
    leituras: Number(linha?.leituras ?? 0),
    acessosMaterias: Number(linha?.materias ?? 0),
    tempoMedio: Math.round(Number(linha?.tempo ?? 0)),
    compartilhamentos: clique("compartilhar"),
    contatosWhatsapp: clique("contato_whatsapp"),
    cliquesEspecialista: clique("cta_especialista"),
    leads,
  };
}

// ——— Série no tempo ———

export type PontoSerie = {
  /** rótulo curto do eixo ("21/09" ou "14h") */
  rotulo: string;
  /** rótulo completo da dica ("seg., 21 de set." ou "14h–15h") */
  dica: string;
  acessos: number;
  leituras: number;
  visitantes: number;
};

type LinhaSerie = { chave: string; acessos: bigint; leituras: bigint; visitantes: bigint };

const fmtDiaCurto = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
const fmtDiaLongo = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

export async function serie(periodo: Periodo, newsId?: string): Promise<PontoSerie[]> {
  const daNoticia = newsId ? Prisma.sql`AND "newsId" = ${newsId}` : Prisma.empty;
  const chave = periodo.porHora
    ? Prisma.sql`lpad(extract(hour from ${LOCAL})::int::text, 2, '0')`
    : Prisma.sql`to_char(${LOCAL}, 'YYYY-MM-DD')`;

  const linhas = await prisma.$queryRaw<LinhaSerie[]>`
    SELECT ${chave} AS chave,
           count(*) AS acessos,
           count(*) FILTER (WHERE "read") AS leituras,
           count(DISTINCT visitor) AS visitantes
    FROM "PageView"
    WHERE ${entre(periodo.inicio, periodo.fim)} ${daNoticia}
    GROUP BY 1`;
  const por = new Map(linhas.map((l) => [l.chave, l]));
  const valores = (k: string) => {
    const l = por.get(k);
    return {
      acessos: Number(l?.acessos ?? 0),
      leituras: Number(l?.leituras ?? 0),
      visitantes: Number(l?.visitantes ?? 0),
    };
  };

  // Completa os buracos: dia (ou hora) sem acesso aparece como zero, não some.
  if (periodo.porHora) {
    const horaAgora = Number(new Date(Date.now() - FUSO_MS).toISOString().slice(11, 13));
    return Array.from({ length: horaAgora + 1 }, (_, h) => {
      const k = String(h).padStart(2, "0");
      return { rotulo: `${h}h`, dica: `${h}h–${h + 1}h`, ...valores(k) };
    });
  }

  const pontos: PontoSerie[] = [];
  for (let t = periodo.inicio.getTime(); t < periodo.fim.getTime(); t += DIA_MS) {
    const dia = diaLocal(new Date(t));
    const meioDia = new Date(`${dia}T12:00:00Z`);
    pontos.push({
      rotulo: fmtDiaCurto.format(meioDia),
      dica: fmtDiaLongo.format(meioDia),
      ...valores(dia),
    });
  }
  return pontos;
}

// ——— Origem, horário e aparelho ———

export type FatiaOrigem = { origem: Origem; acessos: number };

export async function origens(inicio: Date, fim: Date, newsId?: string): Promise<FatiaOrigem[]> {
  const grupos = await prisma.pageView.groupBy({
    by: ["source"],
    where: { createdAt: { gte: inicio, lt: fim }, ...(newsId ? { newsId } : {}) },
    _count: { _all: true },
  });
  return ORIGENS.map((origem) => ({
    origem,
    acessos: grupos.find((g) => g.source === origem)?._count._all ?? 0,
  }))
    .filter((f) => f.acessos > 0)
    .sort((a, b) => b.acessos - a.acessos);
}

/** Acessos por hora do dia (0–23, no Piauí). */
export async function horarios(inicio: Date, fim: Date): Promise<number[]> {
  const linhas = await prisma.$queryRaw<{ hora: number; acessos: bigint }[]>`
    SELECT extract(hour from ${LOCAL})::int AS hora, count(*) AS acessos
    FROM "PageView"
    WHERE ${entre(inicio, fim)}
    GROUP BY 1`;
  const horas = Array.from({ length: 24 }, () => 0);
  for (const l of linhas) horas[l.hora] = Number(l.acessos);
  return horas;
}

export async function dispositivos(
  inicio: Date,
  fim: Date,
  newsId?: string
): Promise<{ celular: number; computador: number }> {
  const grupos = await prisma.pageView.groupBy({
    by: ["device"],
    where: { createdAt: { gte: inicio, lt: fim }, ...(newsId ? { newsId } : {}) },
    _count: { _all: true },
  });
  const de = (d: string) => grupos.find((g) => g.device === d)?._count._all ?? 0;
  return { celular: de("celular"), computador: de("computador") };
}

// ——— Mais lidas ———

export type ItemRanking = {
  id: string;
  title: string;
  slug: string;
  category: NewsCategory;
  acessos: number;
  leituras: number;
  compartilhamentos: number;
};

/**
 * Ranking do período, por LEITURAS (quem leu de fato) e, no empate, por
 * acessos. Ordenar só por acessos premiaria título chamativo que ninguém lê.
 */
export async function maisLidas(inicio: Date, fim: Date, limite = 10): Promise<ItemRanking[]> {
  const linhas = await prisma.$queryRaw<{ newsId: string; acessos: bigint; leituras: bigint }[]>`
    SELECT "newsId", count(*) AS acessos, count(*) FILTER (WHERE "read") AS leituras
    FROM "PageView"
    WHERE ${entre(inicio, fim)} AND "newsId" IS NOT NULL
    GROUP BY "newsId"
    ORDER BY leituras DESC, acessos DESC
    LIMIT ${limite}`;
  if (linhas.length === 0) return [];

  const ids = linhas.map((l) => l.newsId);
  const [noticias, shares] = await Promise.all([
    prisma.news.findMany({
      where: { id: { in: ids } },
      select: { id: true, title: true, slug: true, category: true },
    }),
    prisma.clickEvent.groupBy({
      by: ["newsId"],
      where: { newsId: { in: ids }, kind: "compartilhar", createdAt: { gte: inicio, lt: fim } },
      _count: { _all: true },
    }),
  ]);

  return linhas.flatMap((l) => {
    const n = noticias.find((x) => x.id === l.newsId);
    if (!n) return [];
    return [
      {
        ...n,
        acessos: Number(l.acessos),
        leituras: Number(l.leituras),
        compartilhamentos: shares.find((s) => s.newsId === l.newsId)?._count._all ?? 0,
      },
    ];
  });
}

// ——— Agora e totais por notícia ———

/** Quem abriu alguma página nos últimos 5 minutos. */
export async function agoraNoSite(): Promise<number> {
  const desde = new Date(Date.now() - 5 * 60 * 1000);
  const [linha] = await prisma.$queryRaw<{ n: bigint }[]>`
    SELECT count(DISTINCT visitor) AS n FROM "PageView" WHERE "createdAt" >= ${ts(desde)}::timestamp`;
  return Number(linha?.n ?? 0);
}

/** Acessos e leituras de sempre de cada notícia — para a lista do painel. */
export async function totaisPorNoticia(
  ids: string[]
): Promise<Map<string, { acessos: number; leituras: number }>> {
  if (ids.length === 0) return new Map();
  const linhas = await prisma.$queryRaw<{ newsId: string; acessos: bigint; leituras: bigint }[]>`
    SELECT "newsId", count(*) AS acessos, count(*) FILTER (WHERE "read") AS leituras
    FROM "PageView"
    WHERE "newsId" IN (${Prisma.join(ids)})
    GROUP BY "newsId"`;
  return new Map(
    linhas.map((l) => [l.newsId, { acessos: Number(l.acessos), leituras: Number(l.leituras) }])
  );
}

/** Já existe alguma visita registrada? (para o estado "começando agora") */
export async function temDados(): Promise<boolean> {
  return (await prisma.pageView.findFirst({ select: { id: true } })) !== null;
}

// ——— Formatação ———

/** Variação percentual; null quando não há base de comparação. */
export function variacao(atual: number, anterior: number): number | null {
  if (anterior === 0) return null;
  return Math.round(((atual - anterior) / anterior) * 100);
}

/** Percentual inteiro de a sobre b (0 quando b = 0). */
export function pct(a: number, b: number): number {
  return b > 0 ? Math.round((a / b) * 100) : 0;
}

/** "2 min 15 s", "48 s". */
export function duracao(segundos: number): string {
  if (segundos <= 0) return "—";
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return m > 0 ? `${m} min${s ? ` ${s} s` : ""}` : `${s} s`;
}

/** Janela de 3 horas seguidas com mais acessos — "o melhor horário". */
export function melhorJanela(horas: number[]): { inicio: number; fim: number; acessos: number } | null {
  let melhor: { inicio: number; fim: number; acessos: number } | null = null;
  for (let h = 0; h <= 21; h++) {
    const soma = horas[h] + horas[h + 1] + horas[h + 2];
    if (soma > 0 && (!melhor || soma > melhor.acessos)) melhor = { inicio: h, fim: h + 3, acessos: soma };
  }
  return melhor;
}
