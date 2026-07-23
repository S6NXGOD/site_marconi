import "server-only";
import webpush from "web-push";
import { prisma } from "./prisma";
import { SITE_URL } from "./site";
import { formatarDataCurta } from "./datas";
import { deadlineLabel } from "./news";

/**
 * Notificações push do PWA (Web Push).
 *
 * Envia um aviso ao navegador de quem instalou o site e ativou as notificações
 * — nova notícia publicada e novo prazo. Precisa de um par de chaves VAPID nas
 * variáveis de ambiente; SEM elas a feature simplesmente DORME (nada quebra, o
 * botão de ativar some e os envios viram no-op). Assim o deploy sobe antes de
 * as chaves existirem, sem erro.
 *
 * Gerar o par (uma vez):  npx web-push generate-vapid-keys
 *   → NEXT_PUBLIC_VAPID_PUBLIC_KEY  (pública, também vai ao navegador)
 *   → VAPID_PRIVATE_KEY             (privada, só no servidor)
 */

const PUBLICA = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const PRIVADA = process.env.VAPID_PRIVATE_KEY;
const SUBJECT = process.env.VAPID_SUBJECT || "mailto:contato@marconinunes.com.br";

/** Só há push se o par de chaves existir e for válido. */
export const pushConfigurado: boolean = (() => {
  if (!PUBLICA || !PRIVADA) return false;
  try {
    webpush.setVapidDetails(SUBJECT, PUBLICA, PRIVADA);
    return true;
  } catch (e) {
    console.error("[push] chaves VAPID inválidas — push desativado:", e);
    return false;
  }
})();

export type PushPayload = {
  title: string;
  body: string;
  /** para onde o clique leva */
  url: string;
  /** imagem grande de preview (capa da notícia). URL absoluta. */
  image?: string;
  /** agrupa/atualiza notificações do mesmo assunto */
  tag?: string;
};

/** Caminho local (/foto.jpg) vira URL absoluta; https fica como está. */
function urlAbsoluta(caminho: string | null | undefined): string | undefined {
  if (!caminho) return undefined;
  return caminho.startsWith("http") ? caminho : `${SITE_URL}${caminho}`;
}

/**
 * Dispara o payload para TODAS as inscrições. Tolera falha individual e limpa
 * as inscrições mortas (404/410 = navegador desinstalou/cancelou).
 */
export async function enviarPush(payload: PushPayload): Promise<void> {
  if (!pushConfigurado) return;

  const inscricoes = await prisma.pushSubscription.findMany();
  if (inscricoes.length === 0) return;

  const dados = JSON.stringify(payload);
  const mortos: string[] = [];

  await Promise.all(
    inscricoes.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          dados
        );
      } catch (e) {
        const code = (e as { statusCode?: number })?.statusCode;
        if (code === 404 || code === 410) mortos.push(s.endpoint);
        else console.error("[push] falha ao enviar:", code ?? e);
      }
    })
  );

  if (mortos.length) {
    await prisma.pushSubscription
      .deleteMany({ where: { endpoint: { in: mortos } } })
      .catch(() => {});
  }
}

/**
 * Aviso de nova notícia publicada.
 *
 * O TÍTULO da notificação é a própria manchete (não um "Nova notícia" genérico):
 * o iOS acrescenta "de Portal Marconi Nunes" por conta própria, e com a manchete
 * no título isso lê natural. O corpo é o resumo e a capa entra como preview.
 */
export async function notificarNoticia(n: {
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImage?: string | null;
}): Promise<void> {
  await enviarPush({
    title: n.title,
    body: (n.excerpt ?? "").trim() || "Toque para ler no portal.",
    url: `${SITE_URL}/noticias/${n.slug}`,
    image: urlAbsoluta(n.coverImage || "/og.png"),
    tag: `noticia-${n.slug}`,
  });
}

/** Aviso de novo prazo/alerta — o título é o próprio prazo. */
export async function notificarAlerta(a: {
  title: string;
  date: Date;
}): Promise<void> {
  const prazo = deadlineLabel(a.date).text; // "Vence amanhã", "Faltam 5 dias"…
  await enviarPush({
    title: a.title,
    body: `🗓️ ${prazo} — ${formatarDataCurta(a.date)}`,
    url: `${SITE_URL}/#alertas`,
    tag: "novo-prazo",
  });
}

/** Aviso de nova conta aprovada (prova social da CONPLAN). */
export async function notificarAprovacao(a: {
  municipality: string;
  label: string;
}): Promise<void> {
  await enviarPush({
    title: `✅ ${a.label} — ${a.municipality}`,
    body: "Mais um município com a gestão aprovada pela CONPLAN.",
    url: `${SITE_URL}/#prova-social`,
    tag: "conta-aprovada",
  });
}
