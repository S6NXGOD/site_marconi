import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
  TIPOS_CLIQUE,
  dispositivoDe,
  ehRobo,
  origemDe,
  visitanteDe,
  type TipoClique,
} from "@/lib/pulso";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Recebe os pulsos da Audiência (ver src/lib/pulso-cliente.ts).
 *
 *   { t: "v", id, p, n?, r?, o? }  abriu a página (id da visita, caminho,
 *                                  notícia, domínio de origem, ?via=)
 *   { t: "l", id }                 leu a matéria
 *   { t: "s", id, s }              ficou s segundos com a página visível
 *   { t: "c", k, p, n? }           clicou em algo que importa (k = tipo)
 *
 * Responde sempre 204 e sem corpo: é um sinal, não uma API. O que não serve —
 * robô, visita do próprio admin, excesso, dado torto — é descartado calado.
 */

const nada = () => new NextResponse(null, { status: 204 });

const RE_VISITA = /^[0-9a-f-]{36}$/i; // crypto.randomUUID() do navegador
const RE_NOTICIA = /^[a-z0-9]{20,40}$/i; // cuid
/** Leitura e tempo só atualizam visita recente — ninguém lê por 6 horas. */
const JANELA_MS = 6 * 60 * 60 * 1000;

/** Caminho público, sem query nem âncora. */
function caminho(bruto: unknown): string {
  const p = String(bruto ?? "").split(/[?#]/)[0];
  if (!p.startsWith("/") || p.length > 300) return "";
  if (/^\/(admin|api|login)(\/|$)/.test(p)) return "";
  return p;
}

function noticia(bruto: unknown): string | null {
  const n = String(bruto ?? "");
  return RE_NOTICIA.test(n) ? n : null;
}

export async function POST(request: NextRequest) {
  const ua = request.headers.get("user-agent") ?? "";
  if (ehRobo(ua)) return nada();

  // Quem está logado no painel é da casa: as próprias visitas não contam.
  const sessao = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET }).catch(
    () => null
  );
  if (sessao) return nada();

  const ip = clientIp(request.headers);
  if (!rateLimit(`pulso:${ip}`, 90, 60_000).ok) return nada();

  let d: Record<string, unknown>;
  try {
    const texto = await request.text();
    if (texto.length > 2_000) return nada();
    d = JSON.parse(texto);
  } catch {
    return nada();
  }

  const id = String(d.id ?? "");
  const recente = new Date(Date.now() - JANELA_MS);

  try {
    if (d.t === "v") {
      const path = caminho(d.p);
      if (!RE_VISITA.test(id) || !path) return nada();

      const refHost = String(d.r ?? "")
        .toLowerCase()
        .replace(/[^a-z0-9.-]/g, "")
        .slice(0, 100);
      const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();

      await prisma.pageView.create({
        data: {
          id,
          path,
          newsId: noticia(d.n),
          visitor: await visitanteDe(ip, ua),
          source: origemDe(String(d.o ?? "").slice(0, 40), refHost, ua, host),
          refHost: refHost || null,
          device: dispositivoDe(ua),
        },
      });
    } else if (d.t === "l" && RE_VISITA.test(id)) {
      await prisma.pageView.updateMany({
        where: { id, createdAt: { gt: recente } },
        data: { read: true },
      });
    } else if (d.t === "s" && RE_VISITA.test(id)) {
      // O navegador manda o acumulado; só vale se for maior que o gravado.
      const s = Math.min(Math.max(Math.round(Number(d.s) || 0), 0), 3_600);
      await prisma.pageView.updateMany({
        where: { id, createdAt: { gt: recente }, seconds: { lt: s } },
        data: { seconds: s },
      });
    } else if (d.t === "c") {
      const kind = String(d.k ?? "") as TipoClique;
      const path = caminho(d.p);
      if (!TIPOS_CLIQUE.includes(kind) || !path) return nada();

      await prisma.clickEvent.create({
        data: { kind, path, newsId: noticia(d.n), visitor: await visitanteDe(ip, ua) },
      });
    }
  } catch {
    // Visita repetida (id já gravado), notícia que não existe mais… nada disso
    // é erro de verdade — só não conta.
  }

  return nada();
}
