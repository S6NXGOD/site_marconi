import type { PerguntaItem } from "@/lib/content";
import PerguntarNoWhatsApp from "./PerguntarNoWhatsApp";

/** E-mail ou endereço http(s) dentro da resposta — vira link clicável. */
const RE_LINK = /([\w.+-]+@[\w-]+(?:\.[\w-]+)+|https?:\/\/[^\s]+)/g;

/**
 * Texto simples → parágrafos, com e-mail e link clicáveis. Monta elementos do
 * React (nunca HTML cru): o texto vem do painel e não passa por sanitização.
 */
function Resposta({ texto }: { texto: string }) {
  const paragrafos = texto
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <>
      {paragrafos.map((p, i) => (
        <p key={i} className={`whitespace-pre-line ${i > 0 ? "mt-3" : ""}`}>
          {p.split(RE_LINK).map((parte, j) => {
            if (j % 2 === 0) return parte;
            // Pontuação colada no fim ("…/noticias." ou "…)") não é do link.
            const fim = /[.,;:!?)]+$/.exec(parte)?.[0] ?? "";
            const link = parte.slice(0, parte.length - fim.length);
            const email = !link.startsWith("http");
            return (
              <span key={j}>
                <a
                  href={email ? `mailto:${link}` : link}
                  {...(email ? {} : { target: "_blank", rel: "noopener noreferrer" })}
                  className="font-medium text-marconi underline decoration-marconi/40 underline-offset-2 transition-colors hover:decoration-marconi"
                >
                  {link}
                </a>
                {fim}
              </span>
            );
          })}
        </p>
      ))}
    </>
  );
}

/**
 * Perguntas frequentes da home — editadas no painel (/admin/perguntas).
 * Some quando não há nenhuma ativa.
 *
 * Feito com <details>/<summary> nativos: abre e fecha SEM JavaScript, e é
 * montado inteiro no servidor — não pesa na carga da home. A primeira versão
 * era um componente interativo e dobrou o tempo de hidratação do React. Quem
 * anima (o "+" que gira, a resposta que desliza, o surgir ao rolar) é o CSS,
 * em globals.css (.faq-item).
 */
export default function PerguntasFrequentes({
  perguntas,
  temWhatsapp,
}: {
  perguntas: PerguntaItem[];
  /** há contato de WhatsApp ativo? Sem ele, o convite leva ao formulário. */
  temWhatsapp: boolean;
}) {
  if (perguntas.length === 0) return null;

  return (
    <section id="perguntas-frequentes" className="scroll-mt-24 bg-white py-20 sm:py-24">
      <div className="section-shell grid items-start gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="lg:sticky lg:top-28">
          <span className="kicker text-marconi">
            <span className="h-px w-6 bg-marconi/40" aria-hidden />
            Dúvidas
          </span>
          <h2 className="mt-3 font-serif text-3xl font-semibold text-conplan sm:text-4xl">
            Perguntas frequentes
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-slate-600">
            O que mais nos perguntam sobre o Grupo, os serviços e o portal.
          </p>

          <div className="mt-8 hidden rounded-2xl bg-cloud p-5 ring-1 ring-slate-200 lg:block">
            <Convite temWhatsapp={temWhatsapp} />
          </div>
        </div>

        <div>
          <div className="divide-y divide-slate-200 border-y border-slate-200">
            {perguntas.map((p) => (
              <details key={p.id} className="faq-item group">
                <summary className="flex cursor-pointer items-start justify-between gap-4 py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marconi/30 focus-visible:ring-offset-4 sm:py-6">
                  <span className="faq-pergunta font-serif text-[15px] font-semibold leading-snug text-conplan transition-colors group-hover:text-marconi sm:text-lg">
                    {p.question}
                  </span>
                  {/* "+" que gira até virar "×" e ganha o dourado ao abrir. */}
                  <span
                    aria-hidden
                    className="faq-icone mt-px flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-300 text-conplan group-hover:border-marconi group-hover:text-marconi"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </summary>
                <div className="pb-6 pr-10 text-[15px] leading-relaxed text-slate-600">
                  <Resposta texto={p.answer} />
                </div>
              </details>
            ))}
          </div>

          {/* No celular o convite vem depois das perguntas — é quando ele faz
              sentido: a pessoa leu tudo e não achou. */}
          <div className="mt-8 rounded-2xl bg-cloud p-5 ring-1 ring-slate-200 lg:hidden">
            <Convite temWhatsapp={temWhatsapp} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Convite({ temWhatsapp }: { temWhatsapp: boolean }) {
  return (
    <>
      <p className="font-semibold text-conplan">Não achou sua resposta?</p>
      <p className="mt-1 text-sm leading-relaxed text-slate-600">
        Pergunte direto à nossa equipe.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3">
        {temWhatsapp && <PerguntarNoWhatsApp />}
        <a
          href="#contato"
          className={
            temWhatsapp
              ? "inline-flex items-center gap-1.5 text-sm font-semibold text-marconi transition-colors hover:text-marconi-dark"
              : "inline-flex min-h-11 items-center gap-2 rounded-full bg-marconi px-5 text-sm font-semibold text-white shadow-gold transition-all hover:-translate-y-0.5 hover:bg-marconi-dark"
          }
        >
          {temWhatsapp ? "Ou envie uma mensagem" : "Enviar uma mensagem"}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>
    </>
  );
}
