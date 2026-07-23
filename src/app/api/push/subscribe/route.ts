import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pushConfigurado } from "@/lib/push";

export const runtime = "nodejs";

/**
 * Registra a inscrição de push de um navegador (público — qualquer visitante
 * pode optar por receber). Idempotente pelo endpoint: reinscrever atualiza as
 * chaves em vez de duplicar.
 */
export async function POST(request: Request) {
  if (!pushConfigurado) {
    return NextResponse.json({ error: "Push não configurado." }, { status: 503 });
  }

  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const sub = corpo as {
    endpoint?: unknown;
    keys?: { p256dh?: unknown; auth?: unknown };
  };
  const endpoint = typeof sub.endpoint === "string" ? sub.endpoint : "";
  const p256dh = typeof sub.keys?.p256dh === "string" ? sub.keys.p256dh : "";
  const auth = typeof sub.keys?.auth === "string" ? sub.keys.auth : "";

  if (!endpoint || !p256dh || !auth || !/^https:\/\//.test(endpoint)) {
    return NextResponse.json({ error: "Inscrição inválida." }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { p256dh, auth },
    create: { endpoint, p256dh, auth },
  });

  return NextResponse.json({ ok: true });
}
