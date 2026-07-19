import { slugify } from "./slugify";
import type { TagRank } from "./get-tags";

/**
 * Sugestão de assuntos a partir do texto da notícia (título + corpo).
 *
 * Duas frentes, do mais seguro ao mais ousado:
 *  1. REÚSO — tags que já existem e aparecem no texto. Alta precisão: se a
 *     notícia fala "reforma tributária" e essa tag existe, sugere reaproveitar.
 *  2. NOVAS — candidatas que ainda não são tag: siglas (IRPF, ICMS…) e nomes
 *     próprios (duas/três palavras capitalizadas, "Imposto Seletivo").
 *
 * Função pura e client-safe (roda no campo, enquanto se digita). Não inventa
 * assunto de palavra solta comum — quem decide é quem escreve, clicando.
 */

export type SugestaoAssunto = {
  nome: string;
  tipo: "existente" | "novo";
  count: number;
};

function norm(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// Palavras que não iniciam nem compõem um assunto — barram frases-lixo que
// começam em início de sentença ("Veja Como", "Novo Tributo"…).
const STOP = new Set(
  ("a o as os um uma uns umas de do da dos das em no na nos nas por para com sem sob sobre entre e ou mas que se ao aos como quando onde qual quais quanto apos ate ja nao sim seu sua seus suas este esta estes estas esse essa esses essas isso aquele aquela pelo pela pelos pelas veja saiba confira novo nova novos novas mais menos muito pouco todo toda todos todas cada outro outra outros outras")
    .split(" ")
);

/** `needle` aparece em `hay` respeitando fronteira de palavra? (ambos normalizados) */
function contemPalavra(hay: string, needle: string): boolean {
  if (!needle) return false;
  const borda = (c: string) => !/[a-z0-9]/.test(c);
  let i = hay.indexOf(needle);
  while (i !== -1) {
    const antes = i === 0 ? " " : hay[i - 1];
    const depois = i + needle.length >= hay.length ? " " : hay[i + needle.length];
    if (borda(antes) && borda(depois)) return true;
    i = hay.indexOf(needle, i + 1);
  }
  return false;
}

export function sugerirAssuntos(
  texto: string,
  existentes: TagRank[],
  jaEscolhidos: string[],
  max = 6
): SugestaoAssunto[] {
  const cru = texto || "";
  if (cru.trim().length < 12) return [];

  const hay = " " + norm(cru).replace(/\s+/g, " ") + " ";
  const usados = new Set(jaEscolhidos.map((n) => slugify(n)));
  const out: SugestaoAssunto[] = [];

  // 1) Tags existentes que aparecem no texto — mais usadas e mais específicas
  //    (nome mais longo) primeiro.
  const existMatch = existentes
    .filter((t) => {
      const slug = slugify(t.name);
      return slug && !usados.has(slug) && contemPalavra(hay, norm(t.name));
    })
    .sort((a, b) => b.count - a.count || b.name.length - a.name.length);
  for (const t of existMatch) {
    usados.add(slugify(t.name));
    out.push({ nome: t.name, tipo: "existente", count: t.count });
  }

  // 2) Candidatas novas: siglas e nomes próprios.
  const candidatos: string[] = [];
  for (const s of cru.match(/\b[A-ZÀ-Ý]{2,6}\b/g) || []) candidatos.push(s);
  for (const f of cru.match(
    /\b[A-ZÀ-Ý][a-zà-ÿ]{2,}(?:\s+[A-ZÀ-Ý][a-zà-ÿ]{2,}){1,2}\b/g
  ) || []) {
    if (f.split(/\s+/).some((p) => STOP.has(norm(p)))) continue;
    candidatos.push(f);
  }

  for (const c of candidatos) {
    const nome = c.replace(/\s+/g, " ").trim();
    const slug = slugify(nome);
    if (!slug || usados.has(slug)) continue;
    usados.add(slug);
    out.push({ nome, tipo: "novo", count: 0 });
  }

  return out.slice(0, max);
}
