"use client";

import Image from "next/image";
import * as Tabs from "@radix-ui/react-tabs";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

type Vertical = {
  value: string;
  tabLabel: string;
  eyebrow: string;
  headline: string;
  description: string;
  services: { name: string; icon: ReactNode }[];
  // "photo" preenche o quadro (foto real); "logo" fica contido num cartão branco.
  image: { kind: "photo" | "logo"; src: string; alt: string; badge?: string };
  cta: { label: string; href: string };
};

// Ícones dourados (traço) usados ao lado de cada serviço.
const icons = {
  chart: <path d="M4 19V5M4 19h16M8 15v-4M12 15V9M16 15v-6" />,
  shield: (
    <>
      <path d="M12 2l7 4v6c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6l7-4z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  scale: <path d="M12 3v18M5 7h14M7 7l-3 6h6l-3-6zM17 7l-3 6h6l-3-6z" />,
  people: (
    <>
      <path d="M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1" />
      <circle cx="9.5" cy="7.5" r="3.5" />
      <path d="M21 20v-1a4 4 0 0 0-3-3.87M16 4.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  handshake: <path d="M3 12l4-4 5 4 5-4 4 4-4 5-5-3-5 3-4-5z" />,
  document: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M9 13h6M9 17h4" />
    </>
  ),
  building: (
    <path d="M3 21h18M6 21V9l6-4 6 4v12M9 21v-6h6v6M10.5 9.5h.01M13.5 9.5h.01" />
  ),
};

const verticals: Vertical[] = [
  {
    value: "privado",
    tabLabel: "MARCONI NUNES — SETOR PRIVADO",
    eyebrow: "Marconi Nunes Contabilidade",
    headline: "Solidez contábil para o setor privado",
    description:
      "Estrutura técnica completa para empresas que buscam crescer com segurança, conformidade e proteção do patrimônio.",
    services: [
      { name: "Área Fiscal e Tributária", icon: icons.scale },
      { name: "Área Contábil", icon: icons.chart },
      { name: "Área de RH e Departamento Pessoal", icon: icons.people },
      { name: "Área Societária e Legalização", icon: icons.document },
    ],
    image: {
      kind: "photo",
      src: "/predio_marconinunes.jpg",
      alt: "Sede da Marconi Nunes Contabilidade",
      badge: "/logo_marconinunes.png",
    },
    cta: { label: "Falar com o comercial", href: "#contato" },
  },
  {
    value: "publico",
    tabLabel: "CONPLAN — GESTÃO PÚBLICA",
    eyebrow: "CONPLAN",
    headline: "Excelência na gestão dos municípios",
    description:
      "Assessoria técnica a prefeituras e órgãos públicos, com foco em conformidade, transparência e resultados junto aos órgãos de controle.",
    services: [
      { name: "Gestão de Convênios", icon: icons.handshake },
      { name: "Prestação de Contas de Governo", icon: icons.document },
      { name: "Assessoria a Prefeituras", icon: icons.building },
    ],
    image: {
      kind: "photo",
      src: "/predio_marconinunes.jpg",
      alt: "Sede do Grupo Dr. Marconi Nunes",
      badge: "/conplan.png",
    },
    cta: { label: "Falar com a CONPLAN", href: "#contato" },
  },

];

export default function BusinessAreas() {
  return (
    <section
      id="areas-de-atuacao"
      className="relative overflow-hidden py-24"
      style={{ backgroundColor: "#0B1120" }}
    >
      {/* brilho dourado sutil */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(212,175,55,0.13),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_90%,rgba(255,255,255,0.04),transparent_45%)]" />

      <div className="section-shell relative">
        {/* Título */}
        <div className="max-w-2xl">
          <span className="kicker text-marconi-light">
            <span className="h-px w-8 bg-marconi-light/50" />
            Áreas de Atuação
          </span>
          <h2 className="mt-5 font-serif text-4xl font-semibold leading-tight text-marconi-light md:text-5xl">
            Duas vertentes, uma excelência
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-slate-400">
            Um único grupo, duas frentes especializadas — atendendo com o mesmo
            rigor técnico o setor privado e a administração pública.
          </p>
        </div>

        <Tabs.Root defaultValue="privado" className="mt-14">
          {/* Abas */}
          <Tabs.List
            aria-label="Áreas de atuação do grupo"
            className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-1.5 backdrop-blur-sm sm:flex-row"
          >
            {verticals.map((v) => (
              <Tabs.Trigger
                key={v.value}
                value={v.value}
                className="flex-1 rounded-xl px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-400 transition-all hover:text-white data-[state=active]:bg-marconi data-[state=active]:text-white data-[state=active]:shadow-gold sm:text-sm"
              >
                {v.tabLabel}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {/* Conteúdos */}
          {verticals.map((v) => (
            <Tabs.Content
              key={v.value}
              value={v.value}
              forceMount
              // forceMount mantém as duas vertentes no HTML (SEO/crawlers);
              // a inativa é apenas ocultada visualmente.
              className="mt-10 focus-visible:outline-none data-[state=inactive]:hidden"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="grid items-center gap-12 lg:grid-cols-2"
              >
                {/* Lista de serviços */}
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-marconi">
                    {v.eyebrow}
                  </span>
                  <h3 className="mt-3 font-serif text-3xl font-semibold text-white md:text-4xl">
                    {v.headline}
                  </h3>
                  <p className="mt-4 leading-relaxed text-slate-400">
                    {v.description}
                  </p>

                  <ul className="mt-8 space-y-3">
                    {v.services.map((service, i) => (
                      <motion.li
                        key={service.name}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.35, delay: 0.1 + i * 0.08 }}
                        className="group flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm transition-colors hover:border-marconi/40 hover:bg-white/10"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-marconi/15 text-marconi-light transition-colors group-hover:bg-marconi group-hover:text-white">
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            {service.icon}
                          </svg>
                        </span>
                        <span className="text-base font-medium text-white">
                          {service.name}
                        </span>
                      </motion.li>
                    ))}
                  </ul>

                  <a
                    href={v.cta.href}
                    className="mt-8 inline-flex items-center gap-2 rounded-full bg-marconi px-6 py-3.5 text-sm font-semibold text-white shadow-gold transition-all hover:-translate-y-0.5 hover:bg-marconi-light"
                  >
                    {v.cta.label}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                </div>

                {/* Imagem / logo da vertente */}
                <motion.div
                  key={`${v.value}-img`}
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="relative mx-auto w-full max-w-md"
                >
                  <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-marconi/25 to-transparent blur-3xl" />

                  {v.image.kind === "photo" ? (
                    /* Foto real: preenche o quadro */
                    <div className="group relative aspect-[4/3] overflow-hidden rounded-3xl border border-white/10 shadow-elegant">
                      <Image
                        src={v.image.src}
                        alt={v.image.alt}
                        fill
                        sizes="(max-width: 1024px) 100vw, 448px"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      {/* leve escurecida na base para a logo respirar */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                      {v.image.badge && (
                        <span className="absolute bottom-4 left-4 rounded-xl bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm">
                          <Image
                            src={v.image.badge}
                            alt=""
                            width={375}
                            height={214}
                            className="h-8 w-auto object-contain"
                          />
                        </span>
                      )}
                    </div>
                  ) : (
                    /* Logo: contida num cartão claro */
                    <div className="relative flex aspect-[4/3] items-center justify-center rounded-3xl border border-white/10 bg-white/95 p-12 shadow-elegant">
                      <Image
                        src={v.image.src}
                        alt={v.image.alt}
                        width={420}
                        height={220}
                        className="h-auto max-h-full w-auto max-w-full object-contain"
                      />
                    </div>
                  )}
                </motion.div>
              </motion.div>
            </Tabs.Content>
          ))}
        </Tabs.Root>
      </div>
    </section>
  );
}
