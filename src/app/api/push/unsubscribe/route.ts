import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/** Cancela a inscrição de push de um navegador, pelo endpoint. */
export async function POST(request: Request) {
  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const endpoint = (corpo as { endpoint?: unknown })?.endpoint;
  if (typeof endpoint !== "string" || !endpoint) {
    return NextResponse.json({ error: "Endpoint ausente." }, { status: 400 });
  }

  await prisma.pushSubscription
    .deleteMany({ where: { endpoint } })
    .catch(() => {});

  return NextResponse.json({ ok: true });
}
