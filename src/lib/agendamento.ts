import "server-only";
import { prisma } from "./prisma";
import { notificarNoticias, type NoticiaAviso } from "./push";

/**
 * Agendamento de notícias.
 *
 * Quem publica a agendada é um relógio dentro do próprio servidor (ver
 * instrumentation.ts), e não um Cron externo: a rotina diária de prazos já
 * mostrou que depender de um agendador de fora é uma configuração a mais que
 * pode faltar — e aqui a falha seria silenciosa: a notícia simplesmente não sai.
 *
 * Perder uma volta não faz mal. A consulta é "passou da hora", não "é agora":
 * se o servidor estava reiniciando às 9h, a notícia sai na primeira volta depois
 * de ele subir.
 */

const INTERVALO_MS = 30_000;

const relogio = globalThis as typeof globalThis & {
  agendadorTimer?: ReturnType<typeof setInterval>;
  /** Hora da última volta concluída — é o que o /api/health informa. */
  agendadorUltimaVolta?: number;
};

/**
 * Dispara o push das notícias que ainda não avisaram ninguém.
 *
 * Reserva antes de enviar: se o envio falhar no meio, a notícia fica sem aviso,
 * mas nunca com dois. Para quem recebe, aviso repetido é pior que aviso perdido.
 */
export async function avisarUmaVez(noticias: (NoticiaAviso & { id: string })[]): Promise<void> {
  const reservadas: NoticiaAviso[] = [];
  for (const n of noticias) {
    const { count } = await prisma.news.updateMany({
      where: { id: n.id, notifiedAt: null },
      data: { notifiedAt: new Date() },
    });
    if (count === 1) reservadas.push(n);
  }
  await notificarNoticias(reservadas);
}

/**
 * Põe no ar o que já passou da hora. Devolve quantas foram publicadas.
 *
 * Cada notícia é virada com uma condição, e só segue quem de fato virou: se a
 * pessoa cancelou no mesmo segundo, ou se outra instância do servidor chegou
 * antes (no deploy, a antiga e a nova convivem por um tempo), esta volta desiste.
 */
export async function publicarAgendadas(agora = new Date()): Promise<number> {
  const vencidas = await prisma.news.findMany({
    where: { isPublished: false, scheduledAt: { lte: agora } },
    orderBy: { scheduledAt: "asc" },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImage: true,
      scheduledAt: true,
    },
  });

  const publicadas: typeof vencidas = [];
  for (const n of vencidas) {
    const { count } = await prisma.news.updateMany({
      where: { id: n.id, isPublished: false, scheduledAt: n.scheduledAt },
      data: {
        isPublished: true,
        scheduledAt: null,
        // Sai com a data do agendamento. Com a data antiga (a da fonte, numa
        // importada), o aviso chegaria e a notícia não apareceria no topo.
        publishedAt: n.scheduledAt ?? agora,
        createdAt: n.scheduledAt ?? agora,
      },
    });
    if (count === 1) publicadas.push(n);
  }

  if (publicadas.length > 0) await avisarUmaVez(publicadas);
  return publicadas.length;
}

/** Liga o relógio. Chamado uma vez, na subida do servidor. */
export function iniciarAgendador(): void {
  if (relogio.agendadorTimer) return;

  let ocupado = false;
  const volta = async () => {
    // O envio do push pode demorar mais que o intervalo.
    if (ocupado) return;
    ocupado = true;
    try {
      const n = await publicarAgendadas();
      if (n > 0) console.log(`[agendador] ${n} notícia(s) publicada(s)`);
      relogio.agendadorUltimaVolta = Date.now();
    } catch (e) {
      console.error("[agendador] falha na volta:", e);
    } finally {
      ocupado = false;
    }
  };

  void volta();
  relogio.agendadorTimer = setInterval(volta, INTERVALO_MS);
  relogio.agendadorTimer.unref();
}

/** O relógio está girando? Tolera uma volta perdida antes de dizer que não. */
export function agendadorAtivo(): boolean {
  const ultima = relogio.agendadorUltimaVolta;
  return ultima !== undefined && Date.now() - ultima < INTERVALO_MS * 2.5;
}
