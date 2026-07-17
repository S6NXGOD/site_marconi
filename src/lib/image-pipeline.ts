import sharp from "sharp";

/** Maior lado permitido. Acima disso a imagem é reduzida proporcionalmente. */
const MAX_LADO = 1600;

/**
 * Qualidade do JPEG. 82 com mozjpeg é o ponto onde a diferença visual é
 * imperceptível em foto, mas o arquivo fica bem menor que no 90+ padrão.
 */
const JPEG_Q = 82;

export type Otimizada = {
  buffer: Buffer;
  ext: "jpg" | "png";
  contentType: string;
  width: number;
  height: number;
  /** bytes antes / depois — usado só para log */
  antes: number;
  depois: number;
};

/**
 * Normaliza e comprime a imagem enviada pelo painel.
 *
 * O que faz e por quê:
 *  - `rotate()` aplica a orientação do EXIF. Foto de celular costuma vir
 *    "deitada" sem isso.
 *  - Reduz o maior lado para 1600px (nunca amplia): acima disso é peso puro,
 *    já que o site nunca exibe a imagem tão grande.
 *  - Re-encoda com mozjpeg progressivo — melhor compressão que o encoder do
 *    navegador, com a mesma qualidade percebida.
 *  - Remove metadados (EXIF/GPS). Além de reduzir bytes, evita publicar a
 *    localização de onde a foto foi tirada.
 *  - Preserva PNG quando há transparência (JPEG não tem canal alfa e o fundo
 *    viraria preto).
 *
 * Isso importa em dois pontos que o otimizador do Next NÃO cobre: o arquivo
 * cru é o que vai para o preview do WhatsApp e o que ocupa o volume.
 */
export async function otimizarImagem(entrada: Buffer): Promise<Otimizada> {
  const antes = entrada.byteLength;

  const base = sharp(entrada, { failOn: "none" }).rotate();
  const meta = await base.metadata();

  const maior = Math.max(meta.width ?? 0, meta.height ?? 0);
  const precisaReduzir = maior > MAX_LADO;

  let pipeline = base;
  if (precisaReduzir) {
    pipeline = pipeline.resize({
      width: (meta.width ?? 0) >= (meta.height ?? 0) ? MAX_LADO : undefined,
      height: (meta.height ?? 0) > (meta.width ?? 0) ? MAX_LADO : undefined,
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  const temAlpha = Boolean(meta.hasAlpha);

  const { data, info } = temAlpha
    ? await pipeline
        .png({ compressionLevel: 9, palette: true })
        .toBuffer({ resolveWithObject: true })
    : await pipeline
        .jpeg({ quality: JPEG_Q, progressive: true, mozjpeg: true })
        .toBuffer({ resolveWithObject: true });

  const ext = temAlpha ? "png" : "jpg";
  const contentType = temAlpha ? "image/png" : "image/jpeg";

  // Se a imagem já vinha bem comprimida, re-encodar pode deixá-la MAIOR —
  // e ainda somar uma geração de perda. Nesse caso mantemos o original,
  // desde que ele não precise de redimensionamento nem de correção de
  // orientação e já esteja num formato que o WhatsApp exibe no preview.
  const original_ja_bom =
    !precisaReduzir &&
    data.byteLength >= antes &&
    (meta.orientation ?? 1) === 1 &&
    (meta.format === "jpeg" || meta.format === "png");

  if (original_ja_bom) {
    return {
      buffer: entrada,
      ext: meta.format === "png" ? "png" : "jpg",
      contentType: meta.format === "png" ? "image/png" : "image/jpeg",
      width: meta.width ?? info.width,
      height: meta.height ?? info.height,
      antes,
      depois: antes,
    };
  }

  return {
    buffer: data,
    ext,
    contentType,
    width: info.width,
    height: info.height,
    antes,
    depois: data.byteLength,
  };
}
