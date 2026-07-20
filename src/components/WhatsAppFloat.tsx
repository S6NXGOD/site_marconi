"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Icon } from "@/lib/icons";
import { marcarFloat, useOutroFloatAberto, useEhMobile } from "@/lib/floats";

export type WhatsappItem = {
  id: string;
  title: string;
  subtitle: string;
  phone: string;
  message: string;
  icon: string;
};

// Alterna a cor do ícone entre as opções, para não ficarem todas iguais.
const ACCENTS = [
  "bg-indigo-50 text-indigo-600",
  "bg-amber-50 text-marconi",
  "bg-emerald-50 text-emerald-600",
  "bg-blue-50 text-conplan",
];

function waLink(phone: string, message: string) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

// Atendente exibido na mensagem de boas-vindas.
const ATTENDANT = { name: "Recepção" };

// Marca que a pessoa fechou o atendimento NESTA sessão. Abre sozinho ao entrar
// no site, mas não reabre depois que ela minimiza e navega.
const SESSION_KEY = "mn:whatsapp-fechado";

export default function WhatsAppFloat({
  contacts,
}: {
  contacts: WhatsappItem[];
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Coordenação com o float dos prazos: no mobile, só um aparece por vez.
  const mobile = useEhMobile();
  const prazosAberto = useOutroFloatAberto("whatsapp");
  useEffect(() => {
    marcarFloat("whatsapp", open);
    return () => marcarFloat("whatsapp", false);
  }, [open]);

  // Abre sozinho ao entrar no site, uma vez por sessão. Começa fechado no
  // servidor e no cliente (sem hydration mismatch); o efeito abre depois.
  useEffect(() => {
    if (contacts.length === 0) return;

    let fechado = false;
    try {
      fechado = window.sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      /* sessionStorage indisponível */
    }
    if (fechado) return;

    // Um respiro depois dos prazos, para os dois não pularem juntos na cara.
    // No MOBILE não abre sozinho: os prazos já ocupam o rodapé, e dois cards
    // cheios se sobreporiam. Aqui fica só a bolinha; a pessoa toca se quiser.
    const t = setTimeout(() => {
      if (window.matchMedia("(max-width: 639px)").matches) return;
      setOpen(true);
    }, 1400);
    return () => clearTimeout(t);
  }, [contacts.length]);

  // Fechar de propósito é o que grava a sessão — não a montagem inicial, senão
  // o auto-abrir se envenenaria antes mesmo de rodar.
  function fechar() {
    setOpen(false);
    try {
      window.sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* ignora */
    }
  }

  // Fecha com Esc e ao clicar fora.
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar();
    };
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) fechar();
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  // Sem contato cadastrado o botão não aparece — melhor nenhum canal do que
  // um canal que não leva a ninguém.
  if (contacts.length === 0) return null;

  return (
    <div
      ref={rootRef}
      className={`fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6 ${
        mobile && prazosAberto ? "hidden" : ""
      }`}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            role="dialog"
            aria-label="Atendimento por WhatsApp"
            className="w-[calc(100vw-2rem)] max-w-[20rem] origin-bottom-right overflow-hidden rounded-2xl bg-slate-50 shadow-2xl ring-1 ring-black/5"
          >
            {/* ——— Cabeçalho ——— */}
            <div className="flex items-center gap-3 bg-conplan px-4 py-3.5">
              {/* foto de perfil: a sede do Grupo */}
              <span className="relative block h-10 w-10 shrink-0">
                <span className="relative block h-10 w-10 overflow-hidden rounded-full ring-2 ring-white/20">
                  <Image
                    src="/predio_marconinunes.jpg"
                    alt=""
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </span>
                {/* selo "online" */}
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-conplan bg-emerald-400" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold leading-tight text-white">
                  Grupo Dr. Marconi Nunes
                </p>
                <p className="mt-0.5 text-xs font-medium leading-tight text-emerald-400">
                  Online agora
                </p>
              </div>

              <button
                type="button"
                onClick={fechar}
                aria-label="Minimizar atendimento"
                className="-mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M5 12h14" />
                </svg>
              </button>
            </div>

            {/* ——— Corpo ——— */}
            <div className="space-y-2.5 p-3">
              {/* Mensagem de boas-vindas — sem avatar aqui: a foto de perfil
                  já aparece no cabeçalho, repetir seria redundante. */}
              <div className="rounded-2xl rounded-tl-sm bg-white px-3.5 py-3 shadow-sm ring-1 ring-black/5">
                <p className="text-[11px] font-semibold text-slate-500">
                  {ATTENDANT.name}
                </p>
                <p className="mt-1 text-sm leading-snug text-slate-700">
                  Olá! 👋 Bem-vindo ao Grupo Dr. Marconi Nunes! Como podemos te
                  ajudar hoje?
                </p>
              </div>

              {/* Opções */}
              <ul className="space-y-2.5 pt-1">
                {contacts.map((o, i) => (
                  <li key={o.id}>
                    <a
                      href={waLink(o.phone, o.message)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={fechar}
                      className="flex items-center gap-3 rounded-2xl bg-white px-3.5 py-3 shadow-sm ring-1 ring-black/5 transition-all hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${ACCENTS[i % ACCENTS.length]}`}
                      >
                        <Icon name={o.icon} size={17} strokeWidth={1.8} />
                      </span>

                      <span className="min-w-0">
                        <span className="block text-sm font-semibold leading-tight text-slate-800">
                          {o.title}
                        </span>
                        <span className="mt-0.5 block text-xs leading-tight text-slate-400">
                          {o.subtitle}
                        </span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ——— Botão flutuante ——— */}
      <button
        type="button"
        onClick={() => (open ? fechar() : setOpen(true))}
        aria-expanded={open}
        aria-label={open ? "Fechar atendimento" : "Abrir atendimento pelo WhatsApp"}
        className={`relative flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-colors duration-200 active:scale-95 ${
          open
            ? "bg-conplan text-marconi-light hover:bg-conplan-light"
            : "bg-[#25D366] text-white hover:bg-[#1FB855]"
        }`}
      >
        {!open && (
          <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-20" />
        )}

        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.svg
              key="x"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </motion.svg>
          ) : (
            <motion.svg
              key="wa"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              width="28" height="28" viewBox="0 0 24 24" fill="currentColor"
            >
              <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47 0 1.46 1.06 2.87 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35z" />
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm0 18.02h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.17 8.17 0 0 1-1.25-4.36c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.83 2.41a8.19 8.19 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23z" />
            </motion.svg>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}
