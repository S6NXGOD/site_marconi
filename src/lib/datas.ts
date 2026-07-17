/**
 * Datas do portal, sempre no fuso do Piauí.
 *
 * O fuso precisa ser explícito. Sem ele o `Intl` usa o fuso de quem executa —
 * e o código roda em dois lugares: o servidor no Railway (UTC) e o navegador
 * do leitor (UTC-3). Uma notícia publicada às 22h em Teresina era renderizada
 * com a data do dia seguinte no HTML e com a data certa depois da hidratação.
 *
 * Piauí é America/Fortaleza: UTC-3 e sem horário de verão.
 */
export const FUSO = "America/Fortaleza";

const fmtLongo = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: FUSO,
});

const fmtCurto = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: FUSO,
});

// en-CA formata como yyyy-mm-dd, que é o formato do <input type="date">.
const fmtISO = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: FUSO,
});

function asDate(value: Date | string): Date {
  return typeof value === "string" ? new Date(value) : value;
}

/** "16 de julho de 2026" */
export function formatarData(value: Date | string): string {
  return fmtLongo.format(asDate(value));
}

/** "16/07/2026" */
export function formatarDataCurta(value: Date | string): string {
  return fmtCurto.format(asDate(value));
}

/** Data no formato do <input type="date">, no fuso do Piauí. */
export function inputDeData(value: Date | string): string {
  return fmtISO.format(asDate(value));
}

/** Hoje em Teresina — não "hoje" onde o servidor por acaso estiver. */
export function hojeISO(): string {
  return inputDeData(new Date());
}

/**
 * "2026-07-16" → Date ao meio-dia UTC.
 *
 * Meio-dia, e não meia-noite, de propósito: meia-noite UTC já é o dia anterior
 * em qualquer fuso negativo, então a data escolhida apareceria um dia atrás no
 * site. Do meio-dia, nenhum fuso do mundo cruza a virada do dia.
 */
export function dataDeInput(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;

  const data = new Date(
    Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12)
  );
  return Number.isNaN(data.getTime()) ? null : data;
}

/** A data cai hoje, no Piauí? */
export function ehHoje(value: Date | string): boolean {
  return inputDeData(value) === hojeISO();
}

/**
 * Dias inteiros entre hoje e a data (negativo = passou).
 *
 * Conta dias de CALENDÁRIO no Piauí, não diferença de milissegundos: o que
 * importa num prazo é a virada do dia, não 24h corridas. Normalizar os dois
 * lados para o dia no Piauí também mantém o resultado igual no servidor e no
 * navegador — a conta acontece nos dois.
 */
export function diasAte(value: Date | string): number {
  const hoje = Date.parse(`${hojeISO()}T00:00:00Z`);
  const alvo = Date.parse(`${inputDeData(value)}T00:00:00Z`);
  return Math.round((alvo - hoje) / 86_400_000);
}

/**
 * Corte para "prazos que ainda valem", incluindo os que vencem hoje.
 *
 * Toda data editorial é gravada ao meio-dia UTC, então comparar com o meio-dia
 * de hoje separa exatamente hoje-em-diante de ontem-para-trás — sem precisar
 * de aritmética de fuso. Um `new Date()` com hora zerada erraria: às 22h em
 * Teresina o servidor em UTC já está no dia seguinte e sumiria com o prazo que
 * vence hoje.
 */
export function inicioDeHoje(): Date {
  return dataDeInput(hojeISO()) ?? new Date();
}

/** "seg., 20 de jul." — usado nos cards de prazo. */
const fmtDia = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  timeZone: FUSO,
});

export function formatarDiaPrazo(value: Date | string): string {
  return fmtDia.format(asDate(value));
}
