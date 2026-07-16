"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import AnimatedCounter from "./AnimatedCounter";

type Stat = {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  caption: string;
  icon: ReactNode;
};

/**
 * Índice de aprovações no TCE-PI.
 *
 * Fica OCULTO por padrão: é uma afirmação factual sobre o Tribunal de Contas
 * e não pode ir ao ar sem o número real. Para exibir o card, defina
 * NEXT_PUBLIC_STAT_TCE (ex.: "98") nas variáveis do serviço.
 */
const tceRaw = process.env.NEXT_PUBLIC_STAT_TCE?.trim();
const tceValue = tceRaw && /^\d{1,3}$/.test(tceRaw) ? Number(tceRaw) : null;

const stats: Stat[] = [
  ...(tceValue !== null
    ? [
        {
          value: tceValue,
          suffix: "%",
          label: "Aprovações TCE-PI",
          caption: "Índice de contas aprovadas pelo Tribunal de Contas",
          icon: <path d="M20 6L9 17l-5-5" />,
        },
      ]
    : []),
  {
    value: 25,
    suffix: "+",
    label: "Municípios Assessorados",
    caption: "Prefeituras e municípios atendidos pela CONPLAN",
    icon: (
      <path d="M3 21h18M6 21V9l6-4 6 4v12M9 21v-6h6v6M10.5 9.5h.01M13.5 9.5h.01" />
    ),
  },
  {
    value: 29,
    suffix: "+",
    label: "Anos de Experiência",
    caption: "Quase três décadas de atuação do Grupo",
    icon: (
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
    ),
  },
];

export default function ResultsCounters() {
  return (
    <section id="resultados" className="relative overflow-hidden bg-conplan py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.14),transparent_55%)]" />

      <div className="section-shell relative">
        <div className="mx-auto max-w-2xl text-center">
          <span className="kicker text-marconi-light">
            <span className="h-px w-6 bg-marconi-light/50" />
            Desempenho Comprovado
            <span className="h-px w-6 bg-marconi-light/50" />
          </span>
          <h2 className="mt-5 text-3xl font-semibold text-white md:text-4xl">
            Resultados que definem excelência
          </h2>
          <p className="mt-4 text-slate-300">
            Números que refletem o compromisso da CONPLAN com a gestão pública
            eficiente, transparente e em conformidade.
          </p>
        </div>

        {/* colunas acompanham a quantidade de cards — sem buraco no layout
            quando o índice do TCE-PI não está configurado */}
        <div
          className={`mt-16 grid gap-6 ${
            stats.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2"
          }`}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: index * 0.12 }}
              className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-sm"
            >
              <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-marconi/20 text-marconi-light">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {stat.icon}
                </svg>
              </div>
              <div className="font-serif text-5xl font-bold text-white md:text-6xl">
                <AnimatedCounter
                  to={stat.value}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                />
              </div>
              <h3 className="mt-3 text-lg font-semibold text-marconi-light">
                {stat.label}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {stat.caption}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
