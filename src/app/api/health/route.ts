import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Healthcheck do Railway.
 * Checa o banco também: um app que responde mas não fala com o Postgres
 * está "no ar" sem servir para nada.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", db: "up" });
  } catch (error) {
    console.error("[health] banco indisponível:", error);
    return NextResponse.json({ status: "degraded", db: "down" }, { status: 503 });
  }
}
