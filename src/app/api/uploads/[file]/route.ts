import { NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";
import { UPLOAD_DIR, CONTENT_TYPES, isSafeUploadName } from "@/lib/uploads";

export const runtime = "nodejs";

// Serve as imagens enviadas pelo painel (rota pública — são imagens de notícia).
export async function GET(
  _request: Request,
  { params }: { params: { file: string } }
) {
  const name = params.file;

  if (!isSafeUploadName(name)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) {
    return new NextResponse("Not found", { status: 404 });
  }

  const filePath = path.join(UPLOAD_DIR, name);

  try {
    const info = await stat(filePath);
    if (!info.isFile()) return new NextResponse("Not found", { status: 404 });

    const data = await readFile(filePath);

    return new NextResponse(data, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(info.size),
        // Nome é único por upload -> pode cachear pra sempre.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
