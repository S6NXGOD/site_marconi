import { lookup } from "dns/promises";

/**
 * Busca HTTP para o scraper.
 *
 * Tudo aqui existe porque a URL vem de fora do código: o painel cadastra a
 * fonte e o SERVIDOR é quem faz a requisição. Sem trava, o formulário vira um
 * proxy para a rede interna do Railway (Postgres em postgres.railway.internal,
 * o endpoint de metadados em 169.254.169.254). É um risco menor por ser
 * restrito ao admin, mas é barato de fechar e caro de descobrir depois.
 */

/** Ninguém precisa esperar meio minuto por um site que não responde. */
const TIMEOUT_MS = 15_000;

/** Página de notícias não passa disso; o corte evita engasgar num arquivo. */
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * UA de navegador real. Muitos sites — o do TCE-PI entre eles — respondem 403
 * para clientes sem UA reconhecível. Não é disfarce: a raspagem é do mesmo
 * conteúdo público que qualquer visitante vê, e a matéria importada sai com
 * crédito e link para a origem.
 */
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

/** Faixas privadas, loopback, link-local e metadados de nuvem. */
function ehIpPrivado(ip: string): boolean {
  // IPv6
  if (ip.includes(":")) {
    const v = ip.toLowerCase();
    if (v === "::1" || v === "::") return true;
    if (v.startsWith("fe80") || v.startsWith("fc") || v.startsWith("fd")) return true;
    // ::ffff:10.0.0.1 — IPv4 embutido em IPv6
    const m = /::ffff:(\d+\.\d+\.\d+\.\d+)/.exec(v);
    return m ? ehIpPrivado(m[1]) : false;
  }

  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => Number.isNaN(n))) return true;

  if (p[0] === 10 || p[0] === 127 || p[0] === 0) return true;
  if (p[0] === 172 && p[1] >= 16 && p[1] <= 31) return true;
  if (p[0] === 192 && p[1] === 168) return true;
  if (p[0] === 169 && p[1] === 254) return true; // metadados da nuvem
  if (p[0] === 100 && p[1] >= 64 && p[1] <= 127) return true; // CGNAT
  return false;
}

export class ScrapeError extends Error {}

/**
 * Valida a URL e resolve o host antes de buscar.
 *
 * A resolução importa: bloquear só o texto "localhost" não adianta, porque
 * qualquer domínio pode apontar para 127.0.0.1.
 */
export async function urlSegura(bruta: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(bruta.trim());
  } catch {
    throw new ScrapeError("URL inválida.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ScrapeError("Só http e https são aceitos.");
  }

  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".internal") || host.endsWith(".local")) {
    throw new ScrapeError("Endereço interno não é permitido.");
  }

  try {
    const { address } = await lookup(host);
    if (ehIpPrivado(address)) {
      throw new ScrapeError("Este endereço aponta para a rede interna.");
    }
  } catch (e) {
    if (e instanceof ScrapeError) throw e;
    throw new ScrapeError(`Não consegui resolver o endereço "${host}".`);
  }

  return url;
}

/** Baixa o HTML da página, já com as travas aplicadas. */
export async function buscarHtml(bruta: string): Promise<string> {
  const url = await urlSegura(bruta);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      // manual: um redirect pode sair de um host público para um interno, e a
      // validação de cima já teria passado.
      redirect: "manual",
      // Cabeçalhos de navegador completos: alguns sites recusam quem não
      // "parece" um navegador. Não resolve bloqueio por IP (Cloudflare
      // barrando datacenter), mas passa nos casos limítrofes.
      headers: {
        "User-Agent": USER_AGENT,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Upgrade-Insecure-Requests": "1",
      },
    });

    if (res.status >= 300 && res.status < 400) {
      const destino = res.headers.get("location");
      if (!destino) throw new ScrapeError(`Redirecionamento sem destino (${res.status}).`);
      // Revalida o destino do zero — inclusive se for relativo.
      return buscarHtml(new URL(destino, url).toString());
    }

    if (!res.ok) {
      throw new ScrapeError(
        res.status === 403 || res.status === 429
          ? `O site bloqueou o acesso automático (HTTP ${res.status}). ` +
            "Alguns sites (com proteção da Cloudflare, por exemplo) recusam " +
            "requisições vindas de servidores, mesmo que o site abra normalmente " +
            "no seu navegador. Não há como contornar isso pelo painel."
          : `O site respondeu HTTP ${res.status}.`
      );
    }

    const tipo = res.headers.get("content-type") ?? "";
    if (!tipo.includes("html") && !tipo.includes("xml")) {
      throw new ScrapeError(`A página não devolveu HTML (${tipo || "sem content-type"}).`);
    }

    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) {
      throw new ScrapeError("A página é grande demais.");
    }

    // O charset do cabeçalho manda: site em latin-1 lido como UTF-8 traz todo
    // acento quebrado, e o rascunho entraria com o texto corrompido.
    const charset = /charset=([^;]+)/i.exec(tipo)?.[1]?.trim().toLowerCase();
    const decoder =
      charset && charset !== "utf-8"
        ? new TextDecoder(charset === "iso-8859-1" ? "windows-1252" : charset)
        : new TextDecoder("utf-8");

    return decoder.decode(buf);
  } catch (e) {
    if (e instanceof ScrapeError) throw e;
    if ((e as Error).name === "AbortError") {
      throw new ScrapeError("O site demorou demais para responder.");
    }
    throw new ScrapeError(`Não consegui acessar a página: ${(e as Error).message}`);
  } finally {
    clearTimeout(timer);
  }
}

/** Baixa uma imagem (capa da matéria). Mesmas travas, outro content-type. */
export async function buscarImagem(bruta: string): Promise<Buffer | null> {
  try {
    const url = await urlSegura(bruta);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { "User-Agent": USER_AGENT, Accept: "image/*" },
      });
      if (!res.ok) return null;
      if (!(res.headers.get("content-type") ?? "").startsWith("image/")) return null;

      const buf = await res.arrayBuffer();
      if (buf.byteLength > 12 * 1024 * 1024) return null;
      return Buffer.from(buf);
    } finally {
      clearTimeout(timer);
    }
  } catch {
    // Capa é opcional: a matéria entra sem imagem em vez de a importação falhar.
    return null;
  }
}
