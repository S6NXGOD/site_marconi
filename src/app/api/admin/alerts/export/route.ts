import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { alertasParaCSV } from "@/lib/csv";

export const runtime = "nodejs";

/**
 * Baixa TODOS os alertas cadastrados (a vencer e vencidos, ativos e inativos)
 * como CSV, no mesmo formato do modelo de importação. Serve de backup e de
 * ponto de partida para reimportar depois de editar na planilha.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Não autorizado.", { status: 401 });

  const alertas = await prisma.alert.findMany({
    orderBy: { date: "asc" },
    select: {
      title: true,
      date: true,
      category: true,
      description: true,
      isActive: true,
    },
  });

  // BOM (﻿): sem ele o Excel abre o arquivo com os acentos quebrados.
  const csv = "﻿" + alertasParaCSV(alertas);
  const hoje = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="alertas-${hoje}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
