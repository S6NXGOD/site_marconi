"use client";

import { useEffect } from "react";

/**
 * Registra o service worker do painel.
 *
 * Fica só no layout do /admin: o PWA é exclusivo da área administrativa,
 * então o site público nunca registra service worker nem oferece instalação.
 */
export default function RegisterSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // scope /admin: o SW não intercepta o site público.
    navigator.serviceWorker
      .register("/sw.js", { scope: "/admin" })
      .catch((e) => console.warn("[pwa] service worker não registrado:", e));
  }, []);

  return null;
}
