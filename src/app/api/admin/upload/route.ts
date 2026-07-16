import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { authOptions } from "@/lib/auth";
import { UPLOAD_DIR } from "@/lib/uploads";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// Extensão derivada do mime — nunca do nome enviado pelo usuário.
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

export async function POST(request: Request) {
  // A rota NÃO é coberta pelo middleware (que só protege /admin/**),
  // então a sessão é verificada aqui.
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
  }

  const ext = ALLOWED[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "Formato inválido. Use JPG, PNG, WEBP, AVIF ou GIF." },
      { status: 415 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Imagem muito grande. O limite é 5 MB." },
      { status: 413 }
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  // Nome gerado no servidor — evita path traversal e colisões.
  const filename = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, filename), bytes);

  // Servido pela rota GET /api/uploads/[file].
  // (Gravar em public/ não funcionaria: o `next start` só reconhece os
  //  arquivos que existiam em public/ quando o servidor subiu.)
  return NextResponse.json({ url: `/api/uploads/${filename}` }, { status: 201 });
}
