"use client";

import Image from "next/image";
import * as Tabs from "@radix-ui/react-tabs";
import { motion } from "framer-motion";
import { Icon } from "@/lib/icons";
import { accentOf } from "@/lib/accents";

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
  accent: string;
  services: { id: string; name: string; icon: string }[];
};

export default function BusinessAreas({ areas }: { areas: AreaItem[] }) {
  // Sem áreas cadastradas a seção some — nada de bloco vazio no site.
  if (areas.length === 0) return null;

  return (
    <section
      id="areas-de-atuacao"
      className="relative overflow-hidden py-20 sm:py-24"
      style={{ backgroundColor: "#0B1120" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(212,175,55,0.13),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_90%,rgba(255,255,255,0.04),transparent_45%)]" />

      <div className="section-shell relative">
        {/* Título */}
        <div className="max-w-2xl">
          <span className="kicker text-marconi-light">
            <span className="h-px w-8 bg-marconi-light/50" />
            Áreas de Atuação
          </span>
          <h2 className="mt-4 font-serif text-3xl font-semibold leading-tight text-marconi-light sm:text-4xl md:text-5xl">
            Duas vertentes, uma excelência
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-400 sm:text-lg">
            Um único grupo, duas frentes especializadas — atendendo com o mesmo
            rigor técnico o setor privado e a administração pública.
          </p>
        </div>

        <Tabs.Root defaultValue={areas[0].id} className="mt-10 sm:mt-14">
          {/* Abas — cada uma com a cor da sua vertente */}
          <Tabs.List
            aria-label="Áreas de atuação do grupo"
            className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-1.5 backdrop-blur-sm sm:flex-row"
          >
            {areas.map((a) => {
              const accent = accentOf(a.accent);
              return (
                <Tabs.Trigger
                  key={a.id}
                  value={a.id}
                  className={`min-h-11 flex-1 rounded-xl px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 transition-all hover:text-white sm:px-5 sm:py-3.5 sm:text-sm ${accent.tabActive}`}
                >
                  {a.tabLabel}
                </Tabs.Trigger>
              );
            })}
          </Tabs.List>

          {/* Conteúdos */}
          {areas.map((a, index) => {
            const accent = accentOf(a.accent);
            // Alterna o lado da foto: reforça visualmente a troca de aba.
            const fotoNaEsquerda = index % 2 === 1;

            return (
              <Tabs.Content
                key={a.id}
                value={a.id}
                forceMount
                // forceMount mantém as duas vertentes no HTML (SEO/crawlers);
                // a inativa é apenas ocultada visualmente.
                className="mt-8 focus-visible:outline-none data-[state=inactive]:hidden sm:mt-10"
              >
                <motion.div
                  key={`${a.id}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12"
                >
                  {/* Texto */}
                  <div className={fotoNaEsquerda ? "lg:order-2" : ""}>
                    <span
                      className={`text-xs font-bold uppercase tracking-widest ${accent.eyebrow}`}
                    >
                      {a.eyebrow}
                    </span>
                    <h3 className="mt-3 font-serif text-2xl font-semibold text-white sm:text-3xl md:text-4xl">
                      {a.headline}
                    </h3>
                    <p className="mt-4 leading-relaxed text-slate-400">
                      {a.description}
                    </p>

                    {a.services.length > 0 && (
                      <ul className="mt-7 space-y-3 sm:mt-8">
                        {a.services.map((service, i) => (
                          <motion.li
                            key={service.id}
                            initial={{ opacity: 0, x: fotoNaEsquerda ? 16 : -16 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.35, delay: 0.1 + i * 0.08 }}
                            className={`group flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 backdrop-blur-sm transition-colors hover:bg-white/10 sm:px-5 sm:py-4 ${accent.serviceBorderHover}`}
                          >
                            <span
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors ${accent.serviceIcon} ${accent.serviceIconHover}`}
                            >
                              <Icon name={service.icon} size={20} />
                            </span>
                            <span className="text-[15px] font-medium text-white sm:text-base">
                              {service.name}
                            </span>
                          </motion.li>
                        ))}
                      </ul>
                    )}

                    <a
                      href={a.ctaHref}
                      className={`mt-8 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 sm:w-auto ${accent.cta}`}
                    >
                      {a.ctaLabel}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </a>
                  </div>

                  {/* Foto — troca de lado entre as vertentes */}
                  {a.image && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className={`relative mx-auto w-full max-w-md ${fotoNaEsquerda ? "lg:order-1" : ""}`}
                    >
                      <div
                        className={`absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br to-transparent blur-3xl ${accent.glow}`}
                      />
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
            );
          })}
        </Tabs.Root>
      </div>
    </section>
  );
}
