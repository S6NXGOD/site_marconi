/**
 * Rate limit simples, em memória.
 *
 * Suficiente para proteger o formulário público de contato contra flood de
 * bots. É por instância (não compartilha entre réplicas) — se um dia o site
 * escalar para várias instâncias, isto deve migrar para Redis.
 */
type Registro = { count: number; resetAt: number };

const buckets = new Map<string, Registro>();

// Evita a Map crescer sem limite em processo de longa duração.
const MAX_CHAVES = 5_000;

export function rateLimit(
  key: string,
  limite: number,
  janelaMs: number
): { ok: boolean; restantes: number; resetEmSegundos: number } {
  const agora = Date.now();
  const atual = buckets.get(key);

  if (!atual || agora > atual.resetAt) {
    if (buckets.size >= MAX_CHAVES) {
      // limpeza preguiçosa das entradas já expiradas
      // (forEach em vez de for..of: o target do TS não itera Map direto)
      const expiradas: string[] = [];
      buckets.forEach((v, k) => {
        if (agora > v.resetAt) expiradas.push(k);
      });
      expiradas.forEach((k) => buckets.delete(k));
      if (buckets.size >= MAX_CHAVES) buckets.clear();
    }
    buckets.set(key, { count: 1, resetAt: agora + janelaMs });
    return { ok: true, restantes: limite - 1, resetEmSegundos: janelaMs / 1000 };
  }

  atual.count += 1;
  const resetEmSegundos = Math.ceil((atual.resetAt - agora) / 1000);

  if (atual.count > limite) {
    return { ok: false, restantes: 0, resetEmSegundos };
  }

  return { ok: true, restantes: limite - atual.count, resetEmSegundos };
}

/**
 * IP real do visitante.
 * Atrás do proxy do Railway, o IP verdadeiro vem em x-forwarded-for.
 */
export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip")?.trim() || "desconhecido";
}
