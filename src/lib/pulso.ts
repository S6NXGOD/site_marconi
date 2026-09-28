import { createHash, randomBytes } from "crypto";
import { prisma } from "./prisma";
import { hojeISO } from "./datas";

/**
 * Coleta da Audiência — o lado do servidor.
 *
 * O navegador manda "pulsos" para /api/pulso (abriu a página, leu a matéria,
 * ficou N segundos, clicou em compartilhar). Aqui ficam as regras de quem
 * conta e como classificar, sem guardar nada que identifique uma pessoa:
 *
 *  - nada de cookie;
 *  - o IP nunca é gravado: vira, junto com o navegador, um hash com um SAL DO
 *    DIA — dá para contar visitantes únicos do dia, e no dia seguinte o sal é
 *    apagado e o hash não tem mais como ser ligado a ninguém;
 *  - da página de origem, só o domínio (nunca a URL inteira).
 */

/** Origens do tráfego, na ordem em que o painel mostra. */
export const ORIGENS = [
  "whatsapp",
  "busca",
  "instagram",
  "facebook",
  "push",
  "direto",
  "outros",
] as const;
export type Origem = (typeof ORIGENS)[number];

/** Cliques que importam para o negócio. */
export const TIPOS_CLIQUE = ["compartilhar", "contato_whatsapp", "cta_especialista"] as const;
export type TipoClique = (typeof TIPOS_CLIQUE)[number];

/**
 * Robôs e ferramentas não são leitores. O pulso só sai de navegador que roda
 * JavaScript — o que já deixa de fora a maioria —, mas o Googlebot e os
 * navegadores sem tela rodam, e o preview do WhatsApp se anuncia como tal.
 */
const RE_ROBO =
  /bot|crawl|spider|slurp|facebookexternalhit|facebot|whatsapp|telegram|preview|headless|lighthouse|pagespeed|pingdom|uptime|monitor|python|curl|wget|axios|node-fetch|go-http|java\/|okhttp|httpclient|scrapy|semrush|ahrefs|bytespider|gptbot|claudebot|perplexity/i;

export function ehRobo(ua: string): boolean {
  return !ua || RE_ROBO.test(ua);
}

/** Tablet conta como celular: é tela de toque, lida do mesmo jeito. */
export function dispositivoDe(ua: string): "celular" | "computador" {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(ua) ? "celular" : "computador";
}

/**
 * De onde veio a visita.
 *
 * 1. `?via=` no link — é como o portal marca o que ele mesmo manda: o botão
 *    de WhatsApp põe `via=whatsapp`, o push põe `via=push`. É o único jeito de
 *    enxergar o WhatsApp, que não informa de onde o leitor veio.
 * 2. O domínio de origem (Google, Instagram, Facebook…).
 * 3. O navegador embutido do Instagram/Facebook, que às vezes não manda origem.
 * 4. Sem nada disso: "direto" (digitou, favorito, link sem marca).
 */
export function origemDe(via: string, refHost: string, ua: string, host: string): Origem {
  const v = via.toLowerCase();
  if (v) {
    if (/whats|^wa$/.test(v)) return "whatsapp";
    if (/insta/.test(v)) return "instagram";
    if (/face|^fb$/.test(v)) return "facebook";
    if (/push|notifica/.test(v)) return "push";
    if (/google|busca/.test(v)) return "busca";
    return "outros";
  }

  const r = refHost.toLowerCase();
  if (r && r !== host) {
    if (/google|bing\.|duckduckgo|yahoo\.|ecosia|brave\.com|yandex/.test(r)) return "busca";
    if (/whatsapp|wa\.me/.test(r)) return "whatsapp";
    if (/instagram/.test(r)) return "instagram";
    if (/facebook|fb\.com|fb\.me/.test(r)) return "facebook";
    return "outros";
  }

  if (/Instagram/.test(ua)) return "instagram";
  if (/FBAN|FBAV|FB_IAB/.test(ua)) return "facebook";
  return "direto";
}

/** Visitas com mais de 13 meses saem na faxina diária. */
const RETENCAO_DIAS = 400;

let salDoDia: { dia: string; sal: string } | null = null;

/**
 * Sal do dia (fuso do Piauí). Gravado no banco para valer igual depois de um
 * deploy no meio do dia — senão o mesmo leitor contaria duas vezes. O de ontem
 * é apagado na primeira visita do dia seguinte.
 */
async function sal(): Promise<string> {
  const dia = hojeISO();
  if (salDoDia?.dia === dia) return salDoDia.sal;

  let registro = await prisma.analyticsSalt.findUnique({ where: { day: dia } });
  if (!registro) {
    try {
      registro = await prisma.analyticsSalt.create({
        data: { day: dia, salt: randomBytes(16).toString("hex") },
      });
    } catch {
      // Outra requisição criou no mesmo instante — vale a dela.
      registro = await prisma.analyticsSalt.findUnique({ where: { day: dia } });
    }
    // Faxina uma vez por dia, de carona na troca do sal. Sem await: não
    // precisa segurar a resposta do pulso.
    void faxina(dia);
  }

  salDoDia = { dia, sal: registro!.salt };
  return salDoDia.sal;
}

async function faxina(hoje: string) {
  const corte = new Date(Date.now() - RETENCAO_DIAS * 86_400_000);
  try {
    await prisma.analyticsSalt.deleteMany({ where: { day: { lt: hoje } } });
    await prisma.pageView.deleteMany({ where: { createdAt: { lt: corte } } });
    await prisma.clickEvent.deleteMany({ where: { createdAt: { lt: corte } } });
  } catch (e) {
    console.warn("[pulso] faxina falhou:", (e as Error).message);
  }
}

/** Identificador anônimo do visitante, válido só hoje. */
export async function visitanteDe(ip: string, ua: string): Promise<string> {
  const s = await sal();
  return createHash("sha256").update(`${s}|${ip}|${ua}`).digest("hex").slice(0, 20);
}
