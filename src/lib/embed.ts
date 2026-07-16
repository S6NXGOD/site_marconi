/**
 * Converte o que o admin colar (link do reel OU o código <blockquote> de embed)
 * na URL de embed que vai dentro do <iframe>.
 *
 * Aceita:
 *   https://www.instagram.com/reel/ABC123/
 *   https://instagram.com/p/ABC123/?utm_source=...
 *   <blockquote class="instagram-media" data-instgrm-permalink="https://www.instagram.com/reel/ABC123/">
 *   https://www.youtube.com/watch?v=ABC  |  https://youtu.be/ABC  |  /shorts/ABC
 */
export function toEmbedUrl(input: string | null | undefined): string | null {
  if (!input) return null;

  const instagram = input.match(
    /instagram\.com\/(reels?|p|tv)\/([A-Za-z0-9_-]+)/i
  );
  if (instagram) {
    const kind = instagram[1].toLowerCase().startsWith("reel") ? "reel" : instagram[1].toLowerCase();
    return `https://www.instagram.com/${kind}/${instagram[2]}/embed`;
  }

  const youtube = input.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i
  );
  if (youtube) {
    return `https://www.youtube.com/embed/${youtube[1]}`;
  }

  return null;
}

/** Primeira URL encontrada no texto — usada como fallback (abrir em nova aba). */
export function extractUrl(input: string | null | undefined): string | null {
  if (!input) return null;
  const m = input.match(/https?:\/\/[^\s"'<>]+/i);
  return m ? m[0] : null;
}

