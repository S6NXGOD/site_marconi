"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  /** termo atual, vindo da URL */
  defaultValue?: string;
  /** categoria ativa — preservada ao buscar */
  cat?: string;
};

/**
 * Busca de notícias.
 *
 * É um <form> GET de verdade: a busca vive na URL, então dá para compartilhar
 * o resultado, voltar pelo histórico e funciona com o JS desligado. O router
 * entra só para o botão de limpar.
 */
export default function NewsSearch({ defaultValue = "", cat }: Props) {
  const [valor, setValor] = useState(defaultValue);
  const router = useRouter();

  function limpar() {
    setValor("");
    router.push(cat ? `/noticias?cat=${cat}` : "/noticias");
  }

  return (
    <form action="/noticias" method="get" role="search" className="mt-6">
      {/* A categoria viaja junto: buscar não pode jogar a pessoa de volta
          para "Todas". */}
      {cat && <input type="hidden" name="cat" value={cat} />}

      <div className="relative flex items-center">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="pointer-events-none absolute left-4 text-slate-400"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>

        <input
          type="search"
          name="q"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="Buscar por assunto, órgão, prazo..."
          aria-label="Buscar notícias"
          // `search` nativo traz um X próprio no WebKit que duplicaria o nosso.
          className="w-full rounded-full border border-white/15 bg-white/5 py-3 pl-11 pr-24 text-sm text-white outline-none transition-colors placeholder:text-slate-400 focus:border-marconi focus:bg-white/10 [&::-webkit-search-cancel-button]:hidden"
        />

        <div className="absolute right-1.5 flex items-center gap-1">
          {valor && (
            <button
              type="button"
              onClick={limpar}
              aria-label="Limpar busca"
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
          <button
            type="submit"
            className="rounded-full bg-marconi px-4 py-2 text-xs font-semibold text-white shadow-gold transition-colors hover:bg-marconi-light sm:text-sm"
          >
            Buscar
          </button>
        </div>
      </div>
    </form>
  );
}
