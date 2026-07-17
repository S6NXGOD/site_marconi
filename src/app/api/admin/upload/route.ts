import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { authOptions } from "@/lib/auth";
import { UPLOAD_DIR } from "@/lib/uploads";
import { otimizarImagem } from "@/lib/image-pipeline";

export const runtime = "nodejs";
// O processamento da imagem pode passar do limite padrão em fotos grandes.
export const maxDuration = 60;

const MAX_BYTES = 12 * 1024 * 1024; // 12 MB de entrada (a saída é bem menor)

// Formatos aceitos na ENTRADA. A saída é sempre normalizada pelo pipeline.
const ACEITOS = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/tiff",
  "image/heic",
  "image/heif",
]);

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

  if (!ACEITOS.has(file.type)) {
    return NextResponse.json(
      { error: "Formato inválido. Envie JPG, PNG, WEBP, AVIF, HEIC ou GIF." },
      { status: 415 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Imagem muito grande. O limite é 12 MB." },
      { status: 413 }
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  let otimizada;
  try {
    otimizada = await otimizarImagem(bytes);
  } catch (error) {
    console.error("[upload] falha ao processar imagem:", error);
    return NextResponse.json(
      { error: "Não consegui processar esta imagem. Tente outra." },
      { status: 422 }
    );
  }

  // Nome gerado no servidor — evita path traversal e colisões.
  const filename = `${Date.now()}-${randomBytes(6).toString("hex")}.${otimizada.ext}`;

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, filename), otimizada.buffer);

  const economia = Math.round((1 - otimizada.depois / otimizada.antes) * 100);
  console.log(
    `[upload] ${filename} — ${Math.round(otimizada.antes / 1024)}KB -> ` +
      `${Math.round(otimizada.depois / 1024)}KB (${economia}% menor, ` +
      `${otimizada.width}x${otimizada.height})`
  );

  // Servido pela rota GET /api/uploads/[file].
  // (Gravar em public/ não funcionaria: o `next start` só reconhece os
  //  arquivos que existiam em public/ quando o servidor subiu.)
  return NextResponse.json(
    {
      url: `/uploads/${filename}`.replace("/uploads/", "/api/uploads/"),
      width: otimizada.width,
      height: otimizada.height,
      bytes: otimizada.depois,
    },
    { status: 201 }
  );
}
