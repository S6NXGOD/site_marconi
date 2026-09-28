import type { FatiaOrigem } from "@/lib/audiencia";
import type { Origem } from "@/lib/pulso";

const COR = "#1d4f91";

const ROTULOS: Record<Origem, string> = {
  whatsapp: "WhatsApp",
  busca: "Google e buscadores",
  instagram: "Instagram",
  facebook: "Facebook",
  push: "Notificações do site",
  direto: "Direto",
  outros: "Outros sites",
};

/** Ícones de traço, na cor do texto: a identidade vem do ícone e do nome, não da cor da barra. */
const ICONES: Record<Origem, React.ReactNode> = {
  whatsapp: (
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  ),
  busca: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </>
  ),
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.5 6.5h.01" />
    </>
  ),
  facebook: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />,
  push: <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />,
  direto: <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />,
  outros: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18z" />
    </>
  ),
};

/** De onde vêm os leitores: barras finas numa cor só, com número e percentual à vista. */
export default function Origens({ fatias }: { fatias: FatiaOrigem[] }) {
  const total = fatias.reduce((s, f) => s + f.acessos, 0);
  if (total === 0) {
    return <p className="py-6 text-center text-sm text-slate-400">Nenhum acesso neste período.</p>;
  }
  const maior = fatias[0].acessos;

  return (
    <>
      <ul className="space-y-3.5">
        {fatias.map((f, i) => (
          <li key={f.origem}>
            <div className="flex items-center gap-2.5 text-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-slate-400" aria-hidden="true">
                {ICONES[f.origem]}
              </svg>
              <span className="min-w-0 flex-1 truncate text-slate-700">{ROTULOS[f.origem]}</span>
              <span className="font-semibold tabular-nums text-conplan">
                {f.acessos.toLocaleString("pt-BR")}
              </span>
              <span className="w-10 text-right text-xs tabular-nums text-slate-400">
                {Math.round((f.acessos / total) * 100)}%
              </span>
            </div>
            <div className="ml-[26px] mt-1.5 h-1.5 rounded-full bg-slate-100">
              <div
                className="h-full origin-left animate-crescer-x rounded-full"
                style={{ width: `${(f.acessos / maior) * 100}%`, background: COR, animationDelay: `${i * 70}ms` }}
              />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[11px] leading-snug text-slate-400">
        &quot;Direto&quot; é quem digitou o endereço, usou um favorito ou abriu um link sem
        identificação. Os links compartilhados pelos botões do site já saem marcados como WhatsApp.
      </p>
    </>
  );
}
