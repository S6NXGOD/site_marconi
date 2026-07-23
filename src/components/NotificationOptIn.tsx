"use client";

import { useEffect, useState } from "react";

// Chave pública VAPID — injetada no build. Sem ela, a feature não aparece.
const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

type Estado =
  | "checando" // ainda verificando suporte/estado
  | "indisponivel" // navegador sem push ou sem chave
  | "inativo" // pode ativar
  | "ativo" // já inscrito
  | "negado" // permissão bloqueada no navegador
  | "ocupado"; // inscrevendo/cancelando

/** A chave VAPID vem em base64url; a API do navegador quer um Uint8Array. */
function base64ToUint8(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const bruto = atob(b64);
  const arr = new Uint8Array(bruto.length);
  for (let i = 0; i < bruto.length; i++) arr[i] = bruto.charCodeAt(i);
  return arr;
}

/**
 * Botão para ativar/desativar as notificações do PWA (novas notícias e prazos).
 *
 * Some por completo quando não há suporte ou a chave não está configurada — não
 * mostra um botão que não leva a nada. No iOS, só funciona com o site INSTALADO
 * na tela inicial (é o navegador que decide; aqui a gente só oferece).
 */
export default function NotificationOptIn({ dark = false }: { dark?: boolean }) {
  const [estado, setEstado] = useState<Estado>("checando");

  useEffect(() => {
    if (
      !VAPID ||
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      setEstado("indisponivel");
      return;
    }
    if (Notification.permission === "denied") {
      setEstado("negado");
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setEstado(sub ? "ativo" : "inativo"))
      .catch(() => setEstado("inativo"));
  }, []);

  async function ativar() {
    setEstado("ocupado");
    try {
      const permissao = await Notification.requestPermission();
      if (permissao !== "granted") {
        setEstado(permissao === "denied" ? "negado" : "inativo");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        // cast: o lib DOM tipa como ArrayBuffer estrito; Uint8Array é válido.
        applicationServerKey: base64ToUint8(VAPID!) as BufferSource,
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
      setEstado(res.ok ? "ativo" : "inativo");
    } catch {
      setEstado("inativo");
    }
  }

  async function desativar() {
    setEstado("ocupado");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setEstado("inativo");
    } catch {
      setEstado("ativo");
    }
  }

  if (estado === "checando" || estado === "indisponivel") return null;

  const base =
    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors";

  if (estado === "negado") {
    return (
      <span
        title="As notificações estão bloqueadas nas configurações do navegador."
        className={`${base} ${dark ? "text-slate-400" : "text-slate-400"}`}
      >
        <SinoOff />
        Notificações bloqueadas
      </span>
    );
  }

  if (estado === "ativo") {
    return (
      <button
        type="button"
        onClick={desativar}
        title="Você recebe avisos de novas notícias e prazos. Clique para desativar."
        className={`${base} ${
          dark
            ? "bg-marconi/20 text-marconi-light hover:bg-marconi/30"
            : "bg-marconi/10 text-marconi-dark hover:bg-marconi/20"
        }`}
      >
        <SinoOn />
        Avisos ativos
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={ativar}
      disabled={estado === "ocupado"}
      title="Receba um aviso no celular quando sair notícia nova ou um prazo for cadastrado."
      className={`${base} disabled:opacity-60 ${
        dark
          ? "bg-white/10 text-white hover:bg-white/20"
          : "border border-slate-300 text-conplan hover:border-marconi hover:text-marconi"
      }`}
    >
      <SinoOn />
      {estado === "ocupado" ? "Ativando…" : "Receber avisos"}
    </button>
  );
}

function SinoOn() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function SinoOff() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13.73 21a2 2 0 0 1-3.46 0M18.63 13A17.9 17.9 0 0 1 18 8M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14M18 8a6 6 0 0 0-9.33-5M1 1l22 22" />
    </svg>
  );
}
