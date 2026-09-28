import Link from "next/link";
import AnimatedCounter from "@/components/AnimatedCounter";
import type { Resumo } from "@/lib/audiencia";
import { Delta } from "./Kpi";

type Linha = {
  rotulo: string;
  ajuda: string;
  valor: number;
  antes: number;
  href?: string;
  icone: React.ReactNode;
};

/**
 * O que a leitura virou: compartilhamentos (alcance de graça) e contatos
 * (negócio). É a ponte entre o portal de notícias e o escritório.
 */
export default function Contatos({
  atual,
  anterior,
  comparacao,
}: {
  atual: Resumo;
  anterior: Resumo | null;
  comparacao: string;
}) {
  const linhas: Linha[] = [
    {
      rotulo: "Compartilhamentos",
      ajuda: "Toques em compartilhar no site",
      valor: atual.compartilhamentos,
      antes: anterior?.compartilhamentos ?? 0,
      icone: (
        <>
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
        </>
      ),
    },
    {
      rotulo: "Chamaram no WhatsApp",
      ajuda: "Pelo botão de atendimento",
      valor: atual.contatosWhatsapp,
      antes: anterior?.contatosWhatsapp ?? 0,
      icone: (
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      ),
    },
    {
      rotulo: "Falar com um especialista",
      ajuda: "Convite no fim das matérias",
      valor: atual.cliquesEspecialista,
      antes: anterior?.cliquesEspecialista ?? 0,
      icone: (
        <>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </>
      ),
    },
    {
      rotulo: "Formulários de contato",
      ajuda: "Leads que chegaram pelo site",
      valor: atual.leads,
      antes: anterior?.leads ?? 0,
      href: "/admin/leads",
      icone: <path d="M4 4h16v16H4zM4 8l8 5 8-5" />,
    },
  ];

  return (
    <ul className="divide-y divide-slate-100">
      {linhas.map((l) => {
        const conteudo = (
          <>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-conplan-soft text-conplan">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {l.icone}
              </svg>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-slate-700">{l.rotulo}</span>
              <span className="block text-[11px] text-slate-400">{l.ajuda}</span>
            </span>
            <span className="text-right">
              <span className="block text-lg font-semibold leading-tight text-conplan">
                <AnimatedCounter to={l.valor} duration={1} margem="0px" />
              </span>
              {anterior && (
                <Delta
                  valor={l.valor === 0 && l.antes === 0 ? null : l.valor - l.antes}
                  titulo={comparacao}
                  absoluto
                />
              )}
            </span>
          </>
        );
        return (
          <li key={l.rotulo}>
            {l.href ? (
              <Link href={l.href} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-slate-50">
                {conteudo}
              </Link>
            ) : (
              <div className="flex items-center gap-3 py-3">{conteudo}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
