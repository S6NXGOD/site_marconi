"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { createCommercialLead, type LeadState } from "@/app/actions";

function waLink(phone: string, message: string) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

const initialState: LeadState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-marconi px-6 py-3.5 text-sm font-semibold text-white shadow-gold transition-all hover:-translate-y-0.5 hover:bg-marconi-dark disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
    >
      {pending ? (
        <>
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          Enviando...
        </>
      ) : (
        <>
          Enviar mensagem
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </>
      )}
    </button>
  );
}

const fieldClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-conplan outline-none transition-colors placeholder:text-slate-400 focus:border-marconi focus:ring-2 focus:ring-marconi/20";

/* ——— Comprovante de envio ——— */
function SuccessPanel({
  state,
  onReset,
  whatsapp,
}: {
  state: LeadState;
  onReset: () => void;
  /** telefone (só dígitos) do primeiro contato ativo — vem do painel */
  whatsapp?: string;
}) {
  return (
    <motion.div
      key="success"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      role="status"
      aria-live="polite"
      className="flex flex-col items-center px-2 py-6 text-center sm:py-10"
    >
      {/* Selo animado */}
      <div className="relative">
        <motion.span
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 16 }}
          className="relative flex h-20 w-20 items-center justify-center rounded-full bg-green-50 ring-1 ring-green-200"
        >
          <motion.svg
            width="38"
            height="38"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-green-600"
          >
            <motion.path
              d="M20 6L9 17l-5-5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.45, delay: 0.15, ease: "easeOut" }}
            />
          </motion.svg>
        </motion.span>

        {/* pulso suave ao redor */}
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-green-400/40 animate-soft-ping"
        />
      </div>

      <h3 className="mt-6 font-serif text-2xl font-semibold text-conplan sm:text-3xl">
        {state.name ? `Obrigado, ${state.name}!` : "Contato enviado!"}
      </h3>

      <p className="mt-3 max-w-sm text-slate-600">
        Recebemos sua mensagem. Nossa equipe vai analisar sua necessidade e
        responder <strong className="font-semibold text-conplan">o mais rápido possível</strong>,
        pelo telefone que você informou.
      </p>

      {state.protocol && (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-cloud px-5 py-3">
          <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400">
            Protocolo
          </p>
          <p className="mt-0.5 font-serif text-lg font-semibold tracking-wider text-conplan">
            #{state.protocol}
          </p>
        </div>
      )}

      {/* Atalho: quem tem pressa fala agora.
          O número vem do painel (primeiro contato ativo do WhatsApp);
          sem contato cadastrado, o botão simplesmente não aparece. */}
      <div className="mt-8 flex w-full flex-col items-center gap-3 sm:w-auto">
        {whatsapp && (
          <a
            href={waLink(
              whatsapp,
              "Olá! Acabei de enviar um contato pelo site e gostaria de adiantar o atendimento."
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-[#1FB855] sm:w-auto"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm0 18.02h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.17 8.17 0 0 1-1.25-4.36c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.83 2.41a8.19 8.19 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23z" />
            </svg>
            Falar agora no WhatsApp
          </a>
        )}

        <button
          type="button"
          onClick={onReset}
          className="text-sm font-medium text-slate-500 underline-offset-4 transition-colors hover:text-marconi hover:underline"
        >
          Enviar outra mensagem
        </button>
      </div>
    </motion.div>
  );
}

export default function ContactForm({ whatsapp }: { whatsapp?: string }) {
  const [state, formAction] = useFormState(createCommercialLead, initialState);
  const [showForm, setShowForm] = useState(true);

  // A action devolve um objeto novo a cada envio, então o efeito dispara
  // também quando o usuário envia uma segunda mensagem.
  useEffect(() => {
    if (state.status === "success") setShowForm(false);
  }, [state]);

  return (
    <section id="contato" className="bg-cloud py-24">
      <div className="section-shell">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Texto de apoio */}
          <div>
            <span className="kicker text-marconi">
              <span className="h-px w-6 bg-marconi/50" />
              Fale Conosco
            </span>
            <h2 className="mt-5 text-3xl font-semibold text-conplan md:text-4xl">
              Vamos conversar sobre o seu desafio
            </h2>
            <p className="mt-4 max-w-md text-slate-600">
              Seja uma <strong className="font-semibold text-conplan">empresa</strong> do
              setor privado ou uma{" "}
              <strong className="font-semibold text-conplan">prefeitura</strong>, nossa
              equipe entra em contato para entender sua necessidade e apresentar a
              melhor solução.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-slate-600">
              {[
                "Atendimento consultivo e personalizado",
                "Diagnóstico inicial sem compromisso",
                "Sigilo e conformidade em cada etapa",
              ].map((li) => (
                <li key={li} className="flex items-center gap-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-marconi text-white">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {li}
                </li>
              ))}
            </ul>
          </div>

          {/* Formulário / comprovante */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-elegant">
            <AnimatePresence mode="wait">
              {showForm ? (
                <motion.form
                  key="form"
                  action={formAction}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  {/* Honeypot anti-spam: fora da tela e do fluxo de foco.
                      Humano nunca preenche; bot que preenche tudo é filtrado. */}
                  <div className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden" aria-hidden>
                    <label htmlFor="website">Não preencha este campo</label>
                    <input
                      id="website"
                      name="website"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </div>

                  <div>
                    <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-conplan">
                      Nome
                    </label>
                    <input id="name" name="name" type="text" autoComplete="name" placeholder="Seu nome completo" className={fieldClass} />
                    {state.errors?.name && (
                      <p className="mt-1 text-xs text-red-600">{state.errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="company" className="mb-1.5 block text-sm font-medium text-conplan">
                      Empresa / Município
                    </label>
                    <input id="company" name="company" type="text" autoComplete="organization" placeholder="Nome da empresa ou prefeitura" className={fieldClass} />
                    {state.errors?.company && (
                      <p className="mt-1 text-xs text-red-600">{state.errors.company}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-conplan">
                      Telefone
                    </label>
                    <input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="(86) 90000-0000" className={fieldClass} />
                    {state.errors?.phone && (
                      <p className="mt-1 text-xs text-red-600">{state.errors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="need" className="mb-1.5 block text-sm font-medium text-conplan">
                      Necessidade
                    </label>
                    <textarea id="need" name="need" rows={4} placeholder="Conte-nos como podemos ajudar..." className={`${fieldClass} resize-none`} />
                    {state.errors?.need && (
                      <p className="mt-1 text-xs text-red-600">{state.errors.need}</p>
                    )}
                  </div>

                  {state.status === "error" && state.message && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      role="alert"
                      className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200"
                    >
                      {state.message}
                    </motion.div>
                  )}

                  <SubmitButton />
                </motion.form>
              ) : (
                <SuccessPanel
                  state={state}
                  onReset={() => setShowForm(true)}
                  whatsapp={whatsapp}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
