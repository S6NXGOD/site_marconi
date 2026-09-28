"use client";

import { useCallback, useState } from "react";
import { comVia, ehCelular, linkWhatsApp, mensagemDaNoticia } from "@/lib/share";
import { registrarClique } from "@/lib/pulso-cliente";
import ShareDialog, { WhatsAppIcon } from "@/components/ShareDialog";

type Props = {
  title: string;
  /** resumo da notícia — entra na mensagem compartilhada */
  summary?: string | null;
  /** endereço canônico da matéria — não o da barra, que pode vir com parâmetros */
  url: string;
};

const botaoClass =
  "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium text-white ring-1 backdrop-blur-sm transition-colors";

export default function ShareButton({ title, summary, url }: Props) {
  const [copied, setCopied] = useState(false);
  const [janela, setJanela] = useState(false);
  const fecharJanela = useCallback(() => setJanela(false), []);
  const contarCompartilhamento = useCallback(() => registrarClique("compartilhar"), []);

  // O que vai pelo WhatsApp leva `?via=whatsapp` — é assim que a Audiência
  // enxerga quem chegou por ele. O compartilhar do sistema não sabe para qual
  // app vai, então segue com o link limpo.
  const mensagemWhatsApp = mensagemDaNoticia({ title, summary, url: comVia(url, "whatsapp") });
  const mensagem = mensagemDaNoticia({ title, summary, url });

  async function onShare() {
    // No computador, a janela com as opções: o compartilhar do Windows não
    // leva ao WhatsApp de um jeito útil.
    if (!ehCelular()) {
      setJanela(true);
      return;
    }

    if (navigator.share) {
      try {
        // `text` sem `url` de propósito: passando os dois, o iOS entrega só o
        // link ao WhatsApp e a mensagem se perde. Com o link dentro do texto,
        // o card é montado igual e a mensagem chega sempre.
        await navigator.share({ title, text: mensagem });
        contarCompartilhamento();
        return;
      } catch (err) {
        // Desistir de compartilhar não é erro — não faz sentido copiar o que a
        // pessoa acabou de cancelar.
        if ((err as Error)?.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(mensagem);
      contarCompartilhamento();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard indisponível */
    }
  }

  function onWhatsApp() {
    // No computador o wa.me cai numa página intermediária do WhatsApp; a
    // janela abre o app instalado direto (ou o WhatsApp Web, ou copia).
    if (!ehCelular()) {
      setJanela(true);
      return;
    }
    contarCompartilhamento();
    window.open(linkWhatsApp(mensagemWhatsApp), "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onWhatsApp}
        aria-label="Compartilhar no WhatsApp"
        className={`${botaoClass} bg-[#25D366]/90 ring-white/20 hover:bg-[#25D366]`}
      >
        <WhatsAppIcon />
        <span className="hidden sm:inline">WhatsApp</span>
      </button>

      <button
        type="button"
        onClick={onShare}
        className={`${botaoClass} bg-white/10 ring-white/20 hover:bg-white/20`}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
        </svg>
        {copied ? "Copiado!" : "Compartilhar"}
      </button>

      <ShareDialog
        aberto={janela}
        onFechar={fecharJanela}
        mensagem={mensagemWhatsApp}
        onCompartilhar={contarCompartilhamento}
      />
    </div>
  );
}
