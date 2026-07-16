"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] erro não tratado:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center bg-conplan px-6 py-20">
      <div className="mx-auto max-w-lg text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-marconi/15 text-marconi-light">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          </svg>
        </span>

        <h1 className="mt-6 font-serif text-2xl font-semibold text-white sm:text-3xl">
          Algo deu errado
        </h1>
        <p className="mt-3 text-slate-400">
          Tivemos um problema ao carregar esta página. Tente novamente em
          instantes.
        </p>

        {error.digest && (
          <p className="mt-4 font-mono text-xs text-slate-500">
            Código: {error.digest}
          </p>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-marconi px-6 py-3 text-sm font-semibold text-white shadow-gold transition-all hover:-translate-y-0.5 hover:bg-marconi-light"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    </main>
  );
}
