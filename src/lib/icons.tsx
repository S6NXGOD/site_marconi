import type { ReactNode } from "react";

/**
 * Catálogo de ícones selecionáveis no painel.
 * A chave é o que fica salvo no banco; o valor é o traço do SVG.
 * Todos usam o mesmo viewBox 24x24 e `stroke="currentColor"`.
 */
export const ICONS: Record<string, { label: string; path: ReactNode }> = {
  chart: {
    label: "Gráfico",
    path: <path d="M4 19V5M4 19h16M8 15v-4M12 15V9M16 15v-6" />,
  },
  scale: {
    label: "Balança (tributário)",
    path: <path d="M12 3v18M5 7h14M7 7l-3 6h6l-3-6zM17 7l-3 6h6l-3-6z" />,
  },
  people: {
    label: "Pessoas (RH)",
    path: (
      <>
        <path d="M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1" />
        <circle cx="9.5" cy="7.5" r="3.5" />
        <path d="M21 20v-1a4 4 0 0 0-3-3.87M16 4.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  },
  document: {
    label: "Documento",
    path: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M9 13h6M9 17h4" />
      </>
    ),
  },
  building: {
    label: "Prédio (prefeitura)",
    path: (
      <path d="M3 21h18M6 21V9l6-4 6 4v12M9 21v-6h6v6M10.5 9.5h.01M13.5 9.5h.01" />
    ),
  },
  handshake: {
    label: "Aperto de mão (convênios)",
    path: <path d="M3 12l4-4 5 4 5-4 4 4-4 5-5-3-5 3-4-5z" />,
  },
  shield: {
    label: "Escudo (proteção)",
    path: (
      <>
        <path d="M12 2l7 4v6c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6l7-4z" />
        <path d="M9 12l2 2 4-4" />
      </>
    ),
  },
  lock: {
    label: "Cadeado",
    path: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
  },
  user: {
    label: "Pessoa",
    path: (
      <>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
  },
  chat: {
    label: "Balão de conversa",
    path: (
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    ),
  },
  check: {
    label: "Confirmação",
    path: <path d="M20 6L9 17l-5-5" />,
  },
  calendar: {
    label: "Calendário",
    path: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 11h18" />
      </>
    ),
  },
};

export const ICON_KEYS = Object.keys(ICONS);

/** Devolve o traço do ícone; cai no `chart` se a chave não existir. */
export function iconPath(key: string): ReactNode {
  return (ICONS[key] ?? ICONS.chart).path;
}

/** Ícone pronto para uso. */
export function Icon({
  name,
  size = 20,
  strokeWidth = 1.7,
  className = "",
}: {
  name: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {iconPath(name)}
    </svg>
  );
}
