-- A data exibida passa a ser editorial (`publishedAt`) em vez da data de
-- criação da linha. Assim dá para publicar hoje uma matéria sobre um fato de
-- ontem sem falsear quando o registro entrou no banco.

-- Nasce nulo para o backfill acontecer antes do NOT NULL.
ALTER TABLE "News" ADD COLUMN "publishedAt" TIMESTAMP(3);

-- As notícias que já existem mantêm exatamente a data que o site já mostrava.
UPDATE "News" SET "publishedAt" = "createdAt";

ALTER TABLE "News" ALTER COLUMN "publishedAt" SET NOT NULL;
ALTER TABLE "News" ALTER COLUMN "publishedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- A listagem pública filtra por isPublished e ordena por publishedAt.
DROP INDEX IF EXISTS "News_isPublished_createdAt_idx";
CREATE INDEX "News_isPublished_publishedAt_idx" ON "News"("isPublished", "publishedAt");
