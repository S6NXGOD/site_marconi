import path from "path";

/**
 * Diretório das imagens enviadas pelo painel.
 *
 * Ordem de resolução:
 *  1. UPLOAD_DIR                  — override explícito
 *  2. RAILWAY_VOLUME_MOUNT_PATH   — volume persistente do Railway
 *  3. <projeto>/uploads           — desenvolvimento local
 *
 * Por que fora de public/: o `next start` monta a lista de arquivos estáticos
 * de public/ na inicialização, então um arquivo enviado depois só apareceria
 * ao reiniciar. Estes arquivos são servidos por GET /api/uploads/[file].
 *
 * ⚠️ Em produção isto PRECISA apontar para um volume. O disco do container é
 * efêmero: sem volume, toda imagem some no próximo deploy.
 */
export const UPLOAD_DIR =
  process.env.UPLOAD_DIR?.trim() ||
  process.env.RAILWAY_VOLUME_MOUNT_PATH?.trim() ||
  path.join(process.cwd(), "uploads");

export const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
};

/** Aceita apenas nomes gerados por nós — bloqueia path traversal. */
export function isSafeUploadName(name: string): boolean {
  return /^[A-Za-z0-9._-]+$/.test(name) && !name.includes("..");
}
