"use client";

import Image from "next/image";
import * as Tabs from "@radix-ui/react-tabs";
import { motion } from "framer-motion";
import { Icon } from "@/lib/icons";

export type AreaItem = {
  id: string;
  tabLabel: string;
  eyebrow: string;
  headline: string;
  description: string;
  image: string | null;
  imageAlt: string;
  ctaLabel: string;
  ctaHref: string;
  services: { id: string; name: string; icon: string }[];
};

export default function BusinessAreas({ areas }: { areas: AreaItem[] }) {
  // Sem áreas cadastradas a seção some — nada de bloco vazio no site.
  if (areas.length === 0) return null;

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

        <Tabs.Root defaultValue={areas[0].id} className="mt-14">
          {/* Abas */}
          <Tabs.List
            aria-label="Áreas de atuação do grupo"
            className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-1.5 backdrop-blur-sm sm:flex-row"
          >
            {areas.map((a) => (
              <Tabs.Trigger
                key={a.id}
                value={a.id}
                className="flex-1 rounded-xl px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-400 transition-all hover:text-white data-[state=active]:bg-marconi data-[state=active]:text-white data-[state=active]:shadow-gold sm:text-sm"
              >
                {a.tabLabel}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {/* Conteúdos */}
          {areas.map((a) => (
            <Tabs.Content
              key={a.id}
              value={a.id}
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
                    {a.eyebrow}
                  </span>
                  <h3 className="mt-3 font-serif text-3xl font-semibold text-white md:text-4xl">
                    {a.headline}
                  </h3>
                  <p className="mt-4 leading-relaxed text-slate-400">
                    {a.description}
                  </p>

                  {a.services.length > 0 && (
                    <ul className="mt-8 space-y-3">
                      {a.services.map((service, i) => (
                        <motion.li
                          key={service.id}
                          initial={{ opacity: 0, x: -16 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.35, delay: 0.1 + i * 0.08 }}
                          className="group flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm transition-colors hover:border-marconi/40 hover:bg-white/10"
                        >
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-marconi/15 text-marconi-light transition-colors group-hover:bg-marconi group-hover:text-white">
                            <Icon name={service.icon} size={20} />
                          </span>
                          <span className="text-base font-medium text-white">
                            {service.name}
                          </span>
                        </motion.li>
                      ))}
                    </ul>
                  )}

                  <a
                    href={a.ctaHref}
                    className="mt-8 inline-flex items-center gap-2 rounded-full bg-marconi px-6 py-3.5 text-sm font-semibold text-white shadow-gold transition-all hover:-translate-y-0.5 hover:bg-marconi-light"
                  >
                    {a.ctaLabel}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                </div>

                {/* Foto da vertente */}
                {a.image && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="relative mx-auto w-full max-w-md"
                  >
                    <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-marconi/25 to-transparent blur-3xl" />
                    <div className="group relative aspect-[4/3] overflow-hidden rounded-3xl border border-white/10 shadow-elegant">
                      <Image
                        src={a.image}
                        alt={a.imageAlt || a.eyebrow}
                        fill
                        sizes="(max-width: 1024px) 100vw, 448px"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </Tabs.Content>
          ))}
        </Tabs.Root>
      </div>
    </section>
  );
}
