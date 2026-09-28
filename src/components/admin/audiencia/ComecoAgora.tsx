const ITENS = [
  { titulo: "Acessos e visitantes", texto: "Quantas vezes o site foi aberto e por quantas pessoas, dia a dia." },
  { titulo: "Leituras de verdade", texto: "Quem chegou a 75% do texto — não só quem clicou no título." },
  { titulo: "De onde vêm", texto: "WhatsApp, Google, Instagram, Facebook, notificações ou direto." },
  { titulo: "Melhor horário", texto: "A hora em que seus leitores mais chegam, para mandar as notícias." },
  { titulo: "Compartilhamentos e contatos", texto: "Quem compartilhou, chamou no WhatsApp ou deixou contato." },
];

/** Antes do primeiro acesso: o que vai aparecer aqui, sem gráfico vazio. */
export default function ComecoAgora() {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col items-center px-6 pb-8 pt-10 text-center">
        {/* O "pulso": anéis que se espalham a partir de um ponto. */}
        <span className="relative flex h-14 w-14 items-center justify-center" aria-hidden="true">
          <span className="absolute inset-0 animate-soft-ping rounded-full bg-[#1d4f91]/30" />
          <span className="absolute inset-2 animate-soft-ping rounded-full bg-[#1d4f91]/25 [animation-delay:0.8s]" />
          <span className="relative h-4 w-4 rounded-full bg-[#1d4f91] ring-4 ring-white" />
        </span>
        <h2 className="mt-6 font-serif text-xl font-semibold text-conplan">A medição começou</h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
          Assim que alguém abrir o site, os números aparecem aqui — atualizados na hora. Suas
          próprias visitas, logado no painel, não entram na conta.
        </p>
      </div>

      <ul className="grid gap-px border-t border-slate-100 bg-slate-100 sm:grid-cols-2 lg:grid-cols-5">
        {ITENS.map((i, n) => (
          <li
            key={i.titulo}
            className="animate-fade-up bg-white px-5 py-4"
            style={{ animationDelay: `${n * 80}ms` }}
          >
            <p className="text-sm font-semibold text-conplan">{i.titulo}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{i.texto}</p>
          </li>
        ))}
      </ul>

      <p className="flex items-center justify-center gap-1.5 border-t border-slate-100 px-6 py-3 text-center text-[11px] text-slate-400">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
        Sem cookies e sem dados pessoais — por isso não precisa de aviso de cookies.
      </p>
    </section>
  );
}
