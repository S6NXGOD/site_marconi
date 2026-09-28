"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

/** Ícone do WhatsApp — o mesmo dos botões de compartilhar do site. */
export function WhatsAppIcon({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47s1.06 2.86 1.21 3.06c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.28.17-1.41-.07-.13-.27-.2-.57-.35z" />
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.86 9.86 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24a8.18 8.18 0 0 1 5.82 2.42 8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.69 8.23-8.24 8.23z" />
    </svg>
  );
}

type Props = {
  aberto: boolean;
  onFechar: () => void;
  /** a mensagem pronta: título, resumo, chamada e link */
  mensagem: string;
};

const botao =
  "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2";
const botaoClaro = `${botao} border border-slate-200 bg-white text-conplan hover:bg-slate-50 focus-visible:ring-conplan/30`;

/**
 * Janela de compartilhar no COMPUTADOR.
 *
 * No celular, o wa.me abre o app direto e o compartilhar do sistema lista o
 * WhatsApp. No computador nenhum dos dois ajuda: o wa.me abre uma aba com uma
 * página intermediária do WhatsApp, e o compartilhar do Windows não serve para
 * isso. Aqui a pessoa vê a mensagem pronta e resolve com um clique:
 *  - abrir no WhatsApp instalado no computador (protocolo whatsapp:, direto);
 *  - abrir no WhatsApp Web;
 *  - copiar a mensagem, para colar em qualquer conversa ou grupo.
 */
export default function ShareDialog({ aberto, onFechar, mensagem }: Props) {
  const [copiada, setCopiada] = useState(false);
  const botaoApp = useRef<HTMLAnchorElement>(null);
  const tituloId = useId();

  useEffect(() => {
    if (!aberto) return;

    // Foco no primeiro botão ao abrir e de volta no botão de origem ao fechar;
    // página de trás parada enquanto a janela está aberta.
    const focoAnterior = document.activeElement as HTMLElement | null;
    const rolagem = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setCopiada(false);
    botaoApp.current?.focus();

    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFechar();
    };
    document.addEventListener("keydown", aoTeclar);

    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = rolagem;
      focoAnterior?.focus();
    };
  }, [aberto, onFechar]);

  if (!aberto) return null;

  const texto = encodeURIComponent(mensagem);

  // Fecha logo depois do clique, não durante: o link precisa terminar de
  // abrir o WhatsApp antes de sair da tela.
  const fecharDepois = () => setTimeout(onFechar, 150);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(mensagem);
      setCopiada(true);
    } catch {
      // Sem acesso à área de transferência: a mensagem está à vista logo
      // acima e dá para selecionar e copiar à mão.
    }
  }

  // Portal no <body>: o cabeçalho da matéria tem overflow-hidden e cortaria
  // a janela se ela ficasse dentro dele.
  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/60 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onFechar();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        className="w-full max-w-md rounded-2xl bg-white p-5 text-left shadow-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={tituloId} className="text-base font-semibold text-conplan">
              Compartilhar notícia
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              A mensagem vai pronta, com o link da matéria.
            </p>
          </div>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="-m-1 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Exatamente o que vai para a conversa (os *asteriscos* viram negrito no WhatsApp). */}
        <div className="mt-4 max-h-44 overflow-y-auto whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-3 text-[13px] leading-relaxed text-slate-700 ring-1 ring-slate-200">
          {mensagem}
        </div>

        <div className="mt-4 grid gap-2">
          <a
            ref={botaoApp}
            href={`whatsapp://send?text=${texto}`}
            onClick={fecharDepois}
            className={`${botao} bg-[#128C7E] text-white hover:bg-[#075E54] focus-visible:ring-[#128C7E]/40`}
          >
            <WhatsAppIcon />
            Abrir no WhatsApp do computador
          </a>

          <a
            href={`https://web.whatsapp.com/send?text=${texto}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={fecharDepois}
            className={botaoClaro}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
            </svg>
            Abrir no WhatsApp Web
          </a>

          <button
            type="button"
            onClick={copiar}
            className={
              copiada
                ? `${botao} border border-green-200 bg-green-50 text-green-700 focus-visible:ring-green-300`
                : botaoClaro
            }
          >
            {copiada ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="9" y="9" width="12" height="12" rx="2" />
                <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
              </svg>
            )}
            {copiada ? "Copiada! Cole na conversa (Ctrl+V)" : "Copiar mensagem"}
          </button>
        </div>

        <p className="mt-3 text-[11px] leading-snug text-slate-400">
          Na primeira vez, o navegador pergunta se pode abrir o WhatsApp — marque
          &quot;sempre permitir&quot; para ir direto nas próximas.
        </p>
      </div>
    </div>,
    document.body
  );
}
