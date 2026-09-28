"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { PerguntaItem } from "@/lib/content";
import { abrirWhatsApp } from "@/lib/floats";

/** E-mail ou endereço http(s) dentro da resposta — vira link clicável. */
const RE_LINK = /([\w.+-]+@[\w-]+(?:\.[\w-]+)+|https?:\/\/[^\s]+)/g;

/**
 * Texto simples → parágrafos, com e-mail e link clicáveis. Monta elementos do
 * React (nunca HTML cru): o texto vem do painel e não passa por sanitização.
 */
function Resposta({ texto }: { texto: string }) {
  const paragrafos = texto
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <>
      {paragrafos.map((p, i) => (
        <p key={i} className={`whitespace-pre-line ${i > 0 ? "mt-3" : ""}`}>
          {p.split(RE_LINK).map((parte, j) => {
            if (j % 2 === 0) return parte;
            // Pontuação colada no fim ("…/noticias." ou "…)") não é do link.
            const fim = /[.,;:!?)]+$/.exec(parte)?.[0] ?? "";
            const link = parte.slice(0, parte.length - fim.length);
            const resto = fim;
            const email = !link.startsWith("http");
            return (
              <span key={j}>
                <a
                  href={email ? `mailto:${link}` : link}
                  {...(email ? {} : { target: "_blank", rel: "noopener noreferrer" })}
                  className="font-medium text-marconi underline decoration-marconi/40 underline-offset-2 transition-colors hover:decoration-marconi"
                >
                  {link}
                </a>
                {resto}
              </span>
            );
          })}
        </p>
      ))}
    </>
  );
}

function Pergunta({ item, indice }: { item: PerguntaItem; indice: number }) {
  const [aberta, setAberta] = useState(false);
  const idPergunta = `pergunta-${item.id}`;
  const idResposta = `resposta-${item.id}`;

  return (
    <motion.li
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px 0px" }}
      transition={{ duration: 0.45, delay: Math.min(indice, 6) * 0.05, ease: "easeOut" }}
    >
      <h3>
        <button
          type="button"
          id={idPergunta}
          aria-expanded={aberta}
          aria-controls={idResposta}
          onClick={() => setAberta((a) => !a)}
          className="group flex w-full items-start justify-between gap-4 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marconi/30 focus-visible:ring-offset-4 sm:py-6"
        >
          <span
            className={`text-[15px] font-semibold leading-snug transition-colors sm:text-lg ${
              aberta ? "text-marconi" : "text-conplan group-hover:text-marconi"
            }`}
          >
            {item.question}
          </span>
          {/* "+" que gira até virar "×" e ganha o dourado ao abrir. */}
          <span
            aria-hidden
            className={`mt-px flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
              aberta
                ? "rotate-45 border-marconi bg-marconi text-white"
                : "border-slate-300 text-conplan group-hover:border-marconi group-hover:text-marconi"
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
        </button>
      </h3>

      {/* Abre deslizando (linhas do grid de 0fr para 1fr). "invisible" tira a
          resposta fechada do leitor de tela e da navegação por Tab — mas o
          texto continua no HTML, e o Google o lê normalmente. */}
      <div
        id={idResposta}
        role="region"
        aria-labelledby={idPergunta}
        className={`grid transition-[grid-template-rows,visibility] duration-300 ease-out ${
          aberta ? "visible grid-rows-[1fr]" : "invisible grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div
            className={`pb-6 pr-10 text-[15px] leading-relaxed text-slate-600 transition-all duration-300 ${
              aberta ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
            }`}
          >
            <Resposta texto={item.answer} />
          </div>
        </div>
      </div>
    </motion.li>
  );
}

/**
 * Perguntas frequentes da home — editadas no painel (/admin/perguntas).
 * Some quando não há nenhuma ativa.
 */
export default function PerguntasFrequentes({
  perguntas,
  temWhatsapp,
}: {
  perguntas: PerguntaItem[];
  /** há contato de WhatsApp ativo? Sem ele, o convite leva ao formulário. */
  temWhatsapp: boolean;
}) {
  if (perguntas.length === 0) return null;

  return (
    <section id="perguntas-frequentes" className="scroll-mt-24 bg-white py-20 sm:py-24">
      <div className="section-shell grid items-start gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="lg:sticky lg:top-28">
          <span className="kicker text-marconi">
            <span className="h-px w-6 bg-marconi/40" aria-hidden />
            Dúvidas
          </span>
          <h2 className="mt-3 font-serif text-3xl font-semibold text-conplan sm:text-4xl">
            Perguntas frequentes
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-slate-600">
            O que mais nos perguntam sobre o Grupo, os serviços e o portal.
          </p>

          <div className="mt-8 hidden rounded-2xl bg-cloud p-5 ring-1 ring-slate-200 lg:block">
            <Convite temWhatsapp={temWhatsapp} />
          </div>
        </div>

        <div>
          <ul className="divide-y divide-slate-200 border-y border-slate-200">
            {perguntas.map((p, i) => (
              <Pergunta key={p.id} item={p} indice={i} />
            ))}
          </ul>

          {/* No celular o convite vem depois das perguntas — é quando ele faz
              sentido: a pessoa leu tudo e não achou. */}
          <div className="mt-8 rounded-2xl bg-cloud p-5 ring-1 ring-slate-200 lg:hidden">
            <Convite temWhatsapp={temWhatsapp} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Convite({ temWhatsapp }: { temWhatsapp: boolean }) {
  return (
    <>
      <p className="font-semibold text-conplan">Não achou sua resposta?</p>
      <p className="mt-1 text-sm leading-relaxed text-slate-600">
        Pergunte direto à nossa equipe.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3">
        {temWhatsapp && (
          <button
            type="button"
            onClick={abrirWhatsApp}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#14863E] px-5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#0F7234]"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47s1.06 2.86 1.21 3.06c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.28.17-1.41-.07-.13-.27-.2-.57-.35z" />
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.86 9.86 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24a8.18 8.18 0 0 1 5.82 2.42 8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.69 8.23-8.24 8.23z" />
            </svg>
            Perguntar no WhatsApp
          </button>
        )}
        <a
          href="#contato"
          className={
            temWhatsapp
              ? "inline-flex items-center gap-1.5 text-sm font-semibold text-marconi transition-colors hover:text-marconi-dark"
              : "inline-flex min-h-11 items-center gap-2 rounded-full bg-marconi px-5 text-sm font-semibold text-white shadow-gold transition-all hover:-translate-y-0.5 hover:bg-marconi-dark"
          }
        >
          {temWhatsapp ? "Ou envie uma mensagem" : "Enviar uma mensagem"}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>
    </>
  );
}
