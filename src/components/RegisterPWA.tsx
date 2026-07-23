"use client";

import { useEffect } from "react";

/**
 * Registra o service worker do site público.
 *
 * É o que falta, junto do manifest, para o Chrome/Edge oferecerem "Instalar
 * aplicativo" no desktop. O painel (/admin) tem o seu próprio SW com escopo
 * mais específico, que continua tendo precedência lá dentro.
 */
export default function RegisterPWA() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw-site.js", { scope: "/" })
      .catch((e) => console.warn("[pwa] service worker do site não registrado:", e));
  }, []);

  return null;
}
