import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { agoraNoSite } from "@/lib/audiencia";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Quantas pessoas abriram uma página nos últimos 5 minutos (painel ao vivo). */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  return NextResponse.json(
    { agora: await agoraNoSite() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
