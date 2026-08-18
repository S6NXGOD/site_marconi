import Header from "./Header";
import Footer from "./Footer";

/** Título de seção dentro de uma página legal. */
export function LegalH2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-8 font-serif text-xl font-semibold text-conplan first:mt-0">
      {children}
    </h2>
  );
}

/**
 * Molde das páginas jurídicas (Termos, Privacidade): header sobre um hero
 * escuro (o header é transparente e precisa de fundo escuro atrás), depois o
 * texto num container legível, e o rodapé.
 */
export default function LegalShell({
  titulo,
  atualizacao,
  children,
}: {
  titulo: string;
  atualizacao: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main>
        <section className="bg-conplan pt-28 pb-12 sm:pt-32 sm:pb-14">
          <div className="section-shell">
            <span className="kicker text-marconi-light">
              <span className="h-px w-6 bg-marconi-light/50" />
              Grupo Dr. Marconi Nunes
            </span>
            <h1 className="mt-3 font-serif text-3xl font-semibold text-white sm:text-4xl">
              {titulo}
            </h1>
            <p className="mt-2 text-xs text-slate-400">
              Última atualização: {atualizacao}
            </p>
          </div>
        </section>

        <section className="bg-white py-12 sm:py-16">
          <div className="section-shell mx-auto max-w-3xl space-y-4 text-sm leading-relaxed text-slate-600 [&_a]:font-semibold [&_a]:text-marconi [&_a:hover]:text-marconi-dark [&_li]:mt-1 [&_strong]:text-conplan [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
            {children}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
