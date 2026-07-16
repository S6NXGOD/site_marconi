/**
 * Temas de cor das Áreas de Atuação.
 *
 * As duas vertentes precisam parecer diferentes: sem isso, trocar de aba
 * não comunica nada ao visitante. O Marconi Nunes fica no dourado da marca;
 * a CONPLAN, no azul do logo dela.
 *
 * As classes são escritas por extenso de propósito — o Tailwind não gera
 * classes montadas dinamicamente.
 */
export type AccentKey = "marconi" | "conplan";

type Accent = {
  label: string;
  /** cor do texto do "eyebrow" (nome da empresa) */
  eyebrow: string;
  /** aba ativa */
  tabActive: string;
  /** ícone do serviço (fundo + texto) */
  serviceIcon: string;
  /** ícone do serviço no hover */
  serviceIconHover: string;
  /** borda do item de serviço no hover */
  serviceBorderHover: string;
  /** botão principal */
  cta: string;
  /** brilho por trás da foto */
  glow: string;
  /** ponto de cor no canto do card da listagem do admin */
  dot: string;
};

export const ACCENTS: Record<AccentKey, Accent> = {
  marconi: {
    label: "Marconi Nunes (dourado)",
    eyebrow: "text-marconi",
    tabActive:
      "data-[state=active]:bg-marconi data-[state=active]:text-white data-[state=active]:shadow-gold",
    serviceIcon: "bg-marconi/15 text-marconi-light",
    serviceIconHover: "group-hover:bg-marconi group-hover:text-white",
    serviceBorderHover: "hover:border-marconi/40",
    cta: "bg-marconi hover:bg-marconi-light shadow-gold",
    glow: "from-marconi/25",
    dot: "bg-marconi",
  },
  conplan: {
    label: "CONPLAN (azul)",
    eyebrow: "text-sky-400",
    tabActive:
      "data-[state=active]:bg-sky-600 data-[state=active]:text-white data-[state=active]:shadow-[0_18px_40px_-12px_rgba(2,132,199,0.55)]",
    serviceIcon: "bg-sky-500/15 text-sky-300",
    serviceIconHover: "group-hover:bg-sky-600 group-hover:text-white",
    serviceBorderHover: "hover:border-sky-500/40",
    cta: "bg-sky-600 hover:bg-sky-500 shadow-[0_18px_40px_-12px_rgba(2,132,199,0.55)]",
    glow: "from-sky-500/25",
    dot: "bg-sky-600",
  },
};

export function accentOf(key: string): Accent {
  return ACCENTS[(key as AccentKey) in ACCENTS ? (key as AccentKey) : "marconi"];
}

export const ACCENT_OPTIONS: { value: AccentKey; label: string }[] = [
  { value: "marconi", label: "Marconi Nunes (dourado)" },
  { value: "conplan", label: "CONPLAN (azul)" },
];
