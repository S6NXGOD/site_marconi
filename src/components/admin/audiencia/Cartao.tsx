/** Cartão de seção da Audiência — mesmo visual dos cartões do painel. */
export default function Cartao({
  titulo,
  subtitulo,
  acao,
  className = "",
  children,
}: {
  titulo: string;
  subtitulo?: string;
  acao?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
      <header className="flex items-start justify-between gap-3 px-4 pt-4 sm:px-6 sm:pt-5">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-conplan">{titulo}</h2>
          {subtitulo && <p className="mt-0.5 text-xs text-slate-500">{subtitulo}</p>}
        </div>
        {acao}
      </header>
      <div className="px-4 pb-5 pt-4 sm:px-6 sm:pb-6">{children}</div>
    </section>
  );
}
