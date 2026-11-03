import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { agendadorAtivo } from "@/lib/agendamento";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Healthcheck do Railway.
 * Checa o banco também: um app que responde mas não fala com o Postgres
 * está "no ar" sem servir para nada.
 *
 * O agendador só é informado: não derruba o healthcheck. Logo depois da subida
 * ele ainda não deu a primeira volta, e o site funciona sem ele.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      db: "up",
      agendador: agendadorAtivo() ? "ativo" : "parado",
    });
  } catch (error) {
    console.error("[health] banco indisponível:", error);
    return NextResponse.json({ status: "degraded", db: "down" }, { status: 503 });
  }
}
