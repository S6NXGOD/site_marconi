import type { ReactNode } from "react";

/**
 * Links dentro do texto da notícia.
 *
 * O `content` é texto puro e continua sendo: o único enfeite reconhecido é
 * `[texto](url)`. É o bastante para as referências que a matéria original
 * linka (uma nota técnica, um edital) e mantém o campo editável num textarea
 * comum.
 *
 * O que NÃO é feito aqui, de propósito: interpretar HTML. O texto pode vir de
 * uma raspagem de terceiros, e `dangerouslySetInnerHTML` em cima disso seria
 * XSS na certa. Aqui o <a> é montado por nós, com o texto passando pelo escape
 * normal do React.
 */
const LINK = /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g;

/** Converte a marcação em nós React. Texto sem marcação volta como está. */
export function comLinks(texto: string, chave = ""): ReactNode[] {
  const partes: ReactNode[] = [];
  let ultimo = 0;
  let m: RegExpExecArray | null;

  // A regex é global e guarda estado entre chamadas — zerar evita pular
  // ocorrências do parágrafo seguinte.
  LINK.lastIndex = 0;

  while ((m = LINK.exec(texto)) !== null) {
    if (m.index > ultimo) partes.push(texto.slice(ultimo, m.index));

    partes.push(
      <a
        key={`${chave}-${m.index}`}
        href={m[2]}
        target="_blank"
        // nofollow: é referência da matéria de origem, não recomendação nossa.
        rel="noopener noreferrer nofollow"
        className="font-medium text-marconi underline decoration-marconi/40 underline-offset-2 transition-colors hover:decoration-marconi"
      >
        {m[1]}
      </a>
    );

    ultimo = m.index + m[0].length;
  }

  if (ultimo < texto.length) partes.push(texto.slice(ultimo));
  return partes;
}

/**
 * Tira a marcação, deixando só o texto.
 *
 * Serve para onde link não faz sentido e a marcação apareceria crua: resumo
 * dos cards, description do Google e preview do WhatsApp.
 */
export function semMarcacao(texto: string): string {
  return texto.replace(LINK, "$1");
}
