"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  text: string;
  /** Quantas linhas mostrar antes de cortar. */
  lines?: 2 | 3;
  className?: string;
  /** Classe do botão "Ver mais". */
  buttonClassName?: string;
};

// Mapa explícito: o Tailwind não gera classes montadas dinamicamente.
const CLAMP: Record<2 | 3, string> = {
  2: "line-clamp-2",
  3: "line-clamp-3",
};

/**
 * Texto com corte por linhas + "Ver mais".
 * O botão só aparece quando o texto REALMENTE transborda — se couber inteiro,
 * nada é cortado e nenhum botão polui a interface.
 */
export default function ExpandableText({
  text,
  lines = 2,
  className = "",
  buttonClassName = "",
}: Props) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    // Só mede enquanto está cortado; expandido, scrollHeight == clientHeight.
    if (expanded) return;

    const measure = () => {
      const el = ref.current;
      if (!el) return;
      setOverflowing(el.scrollHeight > el.clientHeight + 1);
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [text, lines, expanded]);

  return (
    <>
      <p
        ref={ref}
        className={`${className} ${expanded ? "" : CLAMP[lines]}`}
      >
        {text}
      </p>

      {(overflowing || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className={`mt-1 inline-flex items-center gap-0.5 font-semibold underline-offset-2 transition-colors hover:underline ${buttonClassName}`}
        >
          {expanded ? "Ver menos" : "Ver mais"}
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </>
  );
}
