import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pushConfigurado, lembrarPrazos } from "@/lib/push";
import { diasAte, inicioDeHoje } from "@/lib/datas";

export const runtime = "nodejs";
// Sem cache: cada chamada consulta o estado atual dos prazos.
export const dynamic = "force-dynamic";

/**
 * Rotina DIÁRIA de lembretes de prazo.
 *
 * Deve ser chamada uma vez por dia (de manhã) por um agendador externo — no
 * Railway, um Cron Job que faz GET nesta URL, ou um serviço de cron gratuito.
 * Varre os prazos ativos e, para os que caem num marco de dias restantes,
 * dispara o lembrete push ("Falta 1 semana", "Faltam 2 dias", "Vence hoje"…).
 *
 * Protegida por CRON_SECRET (header `Authorization: Bearer <secret>` OU
 * `?key=<secret>`). Sem o segredo configurado, responde 503.
 *
 * ⚠️ Pensada para rodar UMA vez ao dia: como cada prazo dispara no dia exato em
 * que atinge o marco, rodar duas vezes no mesmo dia reenviaria o mesmo aviso.
 */

// Marcos de dias restantes que geram lembrete. Ajuste aqui se quiser outros.
const MARCOS = [7, 2, 1, 0];

function autorizado(request: Request): boolean {
  const segredo = process.env.CRON_SECRET;
  if (!segredo) return false;
  const header = request.headers.get("authorization");
  if (header === `Bearer ${segredo}`) return true;
  const key = new URL(request.url).searchParams.get("key");
  return key === segredo;
}

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: "CRON_SECRET não configurado." }, { status: 503 });
  }
  if (!autorizado(request)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  if (!pushConfigurado) {
    return NextResponse.json({ pulado: "push não configurado", enviados: 0 });
  }

  // Só prazos ativos e ainda não vencidos (inclui os que vencem hoje).
  const prazos = await prisma.alert.findMany({
    where: { isActive: true, date: { gte: inicioDeHoje() } },
    select: { id: true, title: true, date: true },
  });

  // Agrupa por marco de urgência: os prazos que caem no mesmo marco viram UMA
  // notificação, em vez de uma por prazo (evita a saraivada de vários no dia).
  const grupos = MARCOS.map((dias) => ({
    dias,
    prazos: prazos.filter((p) => diasAte(p.date) === dias),
  })).filter((g) => g.prazos.length > 0);

  let notificacoes = 0;
  let prazosAvisados = 0;
  for (const g of grupos) {
    try {
      await lembrarPrazos(g.dias, g.prazos);
      notificacoes++;
      prazosAvisados += g.prazos.length;
    } catch (e) {
      console.error("[cron/prazos] falha no marco", g.dias, e);
    }
  }

  return NextResponse.json({
    verificados: prazos.length,
    prazosAvisados,
    notificacoes,
  });
}
