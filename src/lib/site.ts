/**
 * URL pública do site.
 *
 * Ordem de resolução:
 *  1. NEXT_PUBLIC_SITE_URL        — domínio próprio (ex.: https://grupomarconinunes.com.br)
 *  2. NEXTAUTH_URL                — já configurado para o login
 *  3. RAILWAY_PUBLIC_DOMAIN       — domínio *.up.railway.app (injetado pelo Railway)
 *  4. http://localhost:3000       — desenvolvimento
 *
 * Usada em metadataBase (OpenGraph/Twitter), robots.txt e sitemap.xml.
 */
function resolve(): string {
  const explicit =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.NEXTAUTH_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const railway = process.env.RAILWAY_PUBLIC_DOMAIN?.trim();
  if (railway) return `https://${railway.replace(/\/$/, "")}`;

  return "http://localhost:3000";
}

export const SITE_URL = resolve();

export const SITE_NAME = "Grupo Dr. Marconi Nunes";

/** O site só deve ser indexado no domínio final de produção. */
export const IS_INDEXABLE =
  process.env.NODE_ENV === "production" &&
  process.env.ALLOW_INDEXING !== "false" &&
  !SITE_URL.includes("localhost");
