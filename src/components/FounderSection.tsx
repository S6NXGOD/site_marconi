"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const credentials = [
  { value: "CRC-PI", label: "Registro Ativo" },
  { value: "29+", label: "Anos de Atuação" },
];

export default function FounderSection() {
  return (
    <section id="sobre" className="bg-white py-20 sm:py-28">
      <div className="section-shell">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          {/* ——— Retrato ——— */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative mx-auto w-full max-w-md lg:mx-0"
          >
            {/* cantos dourados */}
            <span
              aria-hidden
              className="absolute -left-3 -top-3 h-16 w-16 border-l border-t border-marconi/60 sm:-left-5 sm:-top-5 sm:h-24 sm:w-24"
            />
            <span
              aria-hidden
              className="absolute -bottom-3 -right-3 h-16 w-16 border-b border-r border-marconi/60 sm:-bottom-5 sm:-right-5 sm:h-24 sm:w-24"
            />

            {/* painel claro com o recorte */}
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-slate-100">
              <Image
                src="/marconinunes.png"
                alt="Dr. Marconi Nunes, fundador e diretor técnico do Grupo"
                fill
                sizes="(max-width: 1024px) 100vw, 480px"
                className="object-contain object-bottom"
              />
            </div>

            {/* legenda */}
            <div className="mt-6 flex items-center gap-4">
              <span aria-hidden className="h-px w-10 shrink-0 bg-marconi" />
              <div>
                <p className="font-serif text-lg font-semibold text-conplan">
                  Dr. Marconi Nunes
                </p>
                <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.18em] text-marconi">
                  Fundador &amp; Diretor Técnico
                </p>
              </div>
            </div>
          </motion.div>

          {/* ——— Texto ——— */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-marconi">
              Sobre o Fundador
            </p>

            {/* aspas */}
            <svg
              aria-hidden
              width="34"
              height="26"
              viewBox="0 0 34 26"
              fill="currentColor"
              className="mt-7 text-conplan"
            >
              <path d="M0 26V14.3C0 9.9 1 6.5 3 4c2-2.5 5-4 9-4v5.2c-2 0-3.5.6-4.5 1.7-1 1.1-1.5 2.7-1.5 4.7H14V26H0zm20 0V14.3c0-4.4 1-7.8 3-10.3 2-2.5 5-4 9-4v5.2c-2 0-3.5.6-4.5 1.7-1 1.1-1.5 2.7-1.5 4.7H34V26H20z" />
            </svg>

            <blockquote className="mt-5">
              <p className="font-serif text-2xl italic leading-snug text-conplan sm:text-[1.75rem] sm:leading-[1.35]">
                “A contabilidade deixou de ser apenas números. Hoje, é a
                ferramenta mais poderosa de blindagem patrimonial e governança
                responsável.”
              </p>
            </blockquote>

            <span aria-hidden className="mt-8 block h-px w-14 bg-slate-300" />

            <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-slate-500">
              <p>
                Com mais de 29 anos dedicados à ciência contábil, o{" "}
                <strong className="font-semibold text-conplan">
                  Dr. Marconi Nunes
                </strong>{" "}
                é referência em{" "}
                <strong className="font-semibold text-conplan">
                  contabilidade estratégica
                </strong>{" "}
                no Piauí. Sua atuação une rigor técnico inabalável a uma visão de
                gestão contemporânea que posiciona seus clientes sempre à frente.
              </p>

              <p>
                À frente da{" "}
                <strong className="font-semibold text-conplan">
                  Marconi Nunes Contabilidade
                </strong>{" "}
                e da{" "}
                <strong className="font-semibold text-conplan">CONPlan</strong>,
                construiu um ecossistema contábil que atende desde empresários de
                alta renda até gestores públicos municipais, com o mesmo padrão de
                excelência e ética incontestável.
              </p>

              <p>
                Seu compromisso com a conformidade regulatória, a auditoria
                preventiva e a segurança contábil baseada em dados fez do Grupo
                referência em aprovações junto ao TCE-PI e em proteção patrimonial
                no setor privado.
              </p>
            </div>

            {/* credenciais */}
            <div className="mt-10 grid max-w-md grid-cols-2 gap-4">
              {credentials.map((item) => (
                <div
                  key={item.value}
                  className="border border-slate-200 px-5 py-4 transition-colors hover:border-marconi/50"
                >
                  <p className="font-serif text-xl font-semibold text-conplan">
                    {item.value}
                  </p>
                  <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.15em] text-marconi">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
