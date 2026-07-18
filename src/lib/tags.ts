import { slugify } from "./slugify";

/**
 * Tags livres de assunto (IRPF 2026, Impostos…).
 *
 * O slug é a chave de reúso e de deduplicação: "IRPF 2026", "irpf 2026" e
 * " IRPF  2026 " são a mesma tag. O `name` guarda a grafia que a pessoa
 * escreveu (a primeira a criar); o slug é o que garante que não vire duas.
 */

/** Nome exibível: espaços colapsados e sem exagero de tamanho. */
export function limparNomeTag(nome: string): string {
  return nome.replace(/\s+/g, " ").trim().slice(0, 40);
}

/**
 * Normaliza uma lista de nomes de tag: limpa, tira vazias, dedupa por slug e
 * limita a quantidade. Devolve `{ name, slug }` pronto para o connectOrCreate.
 */
export function normalizarTags(nomes: string[], max = 12): { name: string; slug: string }[] {
  const vistos = new Set<string>();
  const saida: { name: string; slug: string }[] = [];

  for (const bruto of nomes) {
    const name = limparNomeTag(bruto);
    if (!name) continue;
    const slug = slugify(name);
    if (!slug || vistos.has(slug)) continue;
    vistos.add(slug);
    saida.push({ name, slug });
    if (saida.length >= max) break;
  }

  return saida;
}

/** Lê as tags do formulário (enviadas como JSON num input escondido). */
export function tagsDoFormulario(valor: string): { name: string; slug: string }[] {
  let nomes: string[] = [];
  try {
    const parsed = JSON.parse(valor || "[]");
    if (Array.isArray(parsed)) nomes = parsed.map(String);
  } catch {
    // Fallback: separadas por vírgula, caso o JS do campo não tenha rodado.
    nomes = valor.split(",");
  }
  return normalizarTags(nomes);
}
