import type { NewsCategory, AlertCategory } from "@prisma/client";

// ————— Notícias —————
export const categoryLabels: Record<NewsCategory, string> = {
  PUBLICO: "Gestão Pública",
  PRIVADO: "Setor Privado",
  GERAL: "Geral",
};

export const categoryBadgeClasses: Record<NewsCategory, string> = {
  PUBLICO: "bg-conplan text-white",
  PRIVADO: "bg-marconi text-white",
  GERAL: "bg-slate-600 text-white",
};

export const categoryOptions: { value: NewsCategory; label: string }[] = [
  { value: "PUBLICO", label: "Gestão Pública" },
  { value: "PRIVADO", label: "Setor Privado" },
  { value: "GERAL", label: "Geral" },
];

// Fundo de marca usado quando a notícia não tem foto de capa —
// evita o "card branco" e mantém a identidade por vertente.
// Tons contidos para a marca d'água branca continuar legível.
export const categoryCoverGradient: Record<NewsCategory, string> = {
  PUBLICO: "bg-[linear-gradient(135deg,#0A192F_0%,#122F55_55%,#1E4B85_100%)]",
  PRIVADO: "bg-[linear-gradient(135deg,#241B06_0%,#6B5416_55%,#9B7B23_100%)]",
  GERAL: "bg-[linear-gradient(135deg,#0B1120_0%,#2A3550_55%,#465372_100%)]",
};

// Faixa do topo da matéria. SEMPRE escura: o título, a data e os botões são
// brancos, então o fundo não pode clarear (era o que tornava tudo ilegível).
export const categoryHeaderGradient: Record<NewsCategory, string> = {
  PUBLICO: "bg-[linear-gradient(135deg,#06101F_0%,#0A192F_45%,#16406F_100%)]",
  PRIVADO: "bg-[linear-gradient(135deg,#0B1120_0%,#2B2209_45%,#6B5416_100%)]",
  GERAL: "bg-[linear-gradient(135deg,#070C16_0%,#0B1120_45%,#2A3550_100%)]",
};

// ————— Alertas / Prazos —————
export const alertCategoryLabels: Record<AlertCategory, string> = {
  PUBLICO: "Gestão Pública",
  PRIVADO: "Setor Privado",
};

export const alertCategoryBadgeClasses: Record<AlertCategory, string> = {
  PUBLICO: "bg-conplan text-white",
  PRIVADO: "bg-marconi text-white",
};

export const alertCategoryOptions: { value: AlertCategory; label: string }[] = [
  { value: "PUBLICO", label: "Gestão Pública" },
  { value: "PRIVADO", label: "Setor Privado" },
];

/** Dias restantes até a data limite (negativo = vencido). */
export function daysUntil(date: Date | string): number {
  const target = typeof date === "string" ? new Date(date) : date;
  const today = new Date();
  const a = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const b = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.round((b - a) / 86_400_000);
}

/** Um prazo é "da semana" quando vence em até 7 dias (e ainda não venceu). */
export const URGENT_DAYS = 7;

export function isUrgent(date: Date | string): boolean {
  const d = daysUntil(date);
  return d >= 0 && d <= URGENT_DAYS;
}

export type DeadlineTone = "danger" | "warning" | "neutral";

/**
 * Rótulo humano da urgência.
 * Ex.: "Vence hoje", "Vence amanhã", "Faltam 3 dias", "Falta 1 semana".
 */
export function deadlineLabel(date: Date | string): {
  text: string;
  tone: DeadlineTone;
  days: number;
} {
  const days = daysUntil(date);

  if (days < 0) return { text: "Encerrado", tone: "neutral", days };
  if (days === 0) return { text: "Vence hoje", tone: "danger", days };
  if (days === 1) return { text: "Vence amanhã", tone: "danger", days };
  if (days < 7) return { text: `Faltam ${days} dias`, tone: "danger", days };
  if (days === 7) return { text: "Falta 1 semana", tone: "danger", days };
  if (days === 14) return { text: "Faltam 2 semanas", tone: "warning", days };
  if (days <= 30) return { text: `Faltam ${days} dias`, tone: "warning", days };
  return { text: `Faltam ${days} dias`, tone: "neutral", days };
}

/**
 * Agrupa prazos por data (mesmo dia fica junto), preservando a ordem.
 * Garante que vários alertas no mesmo dia apareçam todos — em vez de
 * um sobrepor/esconder o outro.
 */
export function groupByDay<T extends { date: Date | string }>(
  items: T[]
): { key: string; date: Date; items: T[] }[] {
  const groups = new Map<string, { key: string; date: Date; items: T[] }>();

  for (const item of items) {
    const date = typeof item.date === "string" ? new Date(item.date) : item.date;
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

    const existing = groups.get(key);
    if (existing) existing.items.push(item);
    else groups.set(key, { key, date, items: [item] });
  }

  return Array.from(groups.values()).sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );
}
