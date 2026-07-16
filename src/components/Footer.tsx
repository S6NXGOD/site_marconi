import Image from "next/image";
import Link from "next/link";

// Colunas alinhadas aos serviços reais exibidos em #areas-de-atuacao.
const columns: {
  heading: string;
  links: { label: string; href: string }[];
}[] = [
  {
    heading: "CONPLAN — Gestão Pública",
    links: [
      { label: "Gestão de Convênios", href: "/#areas-de-atuacao" },
      { label: "Prestação de Contas de Governo", href: "/#areas-de-atuacao" },
      { label: "Assessoria a Prefeituras", href: "/#areas-de-atuacao" },
      { label: "Contas Aprovadas", href: "/#prova-social" },
      { label: "Alertas & Prazos", href: "/#alertas" },
    ],
  },
  {
    heading: "Marconi Nunes — Setor Privado",
    links: [
      { label: "Área Fiscal e Tributária", href: "/#areas-de-atuacao" },
      { label: "Área Contábil", href: "/#areas-de-atuacao" },
      { label: "Área de RH e Departamento Pessoal", href: "/#areas-de-atuacao" },
      { label: "Área Societária e Legalização", href: "/#areas-de-atuacao" },
    ],
  },
  {
    heading: "Portal",
    links: [
      { label: "Notícias", href: "/noticias" },
      { label: "Áreas de Atuação", href: "/#areas-de-atuacao" },
      { label: "Números do Grupo", href: "/#resultados" },
      { label: "O Grupo", href: "/#sobre" },
      { label: "Fale Conosco", href: "/#contato" },
      { label: "Área Restrita", href: "/login" },
    ],
  },
];

export default function Footer() {
  return (
    <footer id="rodape" className="bg-ink text-slate-300">
      <div className="section-shell py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex flex-row items-center gap-3">
              {/* versão branca da marca — legível no fundo escuro */}
              <Image
                src="/logo_marconinunes_branca.png"
                alt="Marconi Nunes Contabilidade"
                width={375}
                height={214}
                className="h-12 w-auto object-contain"
              />
              <span className="h-7 w-px bg-white/20" aria-hidden />
              <Image
                src="/conplan.png"
                alt="CONPLAN"
                width={375}
                height={214}
                className="h-12 w-auto object-contain"
              />
            </div>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-slate-400">
              Grupo Dr. Marconi Nunes — duas vertentes, uma excelência: gestão
              pública e contabilidade para o setor privado, com segurança e
              conformidade.
            </p>

            <a
              href="/#contato"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-marconi px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-marconi-light"
            >
              Fale Conosco
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>

            <a
              href="mailto:contato@marconinunes.com.br"
              className="mt-4 flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-marconi-light"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M3 7l9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              contato@marconinunes.com.br
            </a>
          </div>

          {columns.map((col) => (
            <div key={col.heading}>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
                {col.heading}
              </h4>
              <ul className="mt-4 space-y-3 text-sm">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {/* Âncoras precisam de <a> nativo — o <Link> não rola
                        até a seção quando já estamos na mesma rota. */}
                    {link.href.includes("#") ? (
                      <a
                        href={link.href}
                        className="text-slate-400 transition-colors hover:text-marconi-light"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-slate-400 transition-colors hover:text-marconi-light"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-slate-500 sm:flex-row">
          <p>
            © {new Date().getFullYear()} Grupo Dr. Marconi Nunes. Todos os
            direitos reservados.
          </p>
          <p>Gestão Pública · Contabilidade · Setor Privado</p>
        </div>
      </div>
    </footer>
  );
}
