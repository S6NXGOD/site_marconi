-- Agendamento de notícias: hora marcada para ir ao ar e registro do push.
ALTER TABLE "News" ADD COLUMN "scheduledAt" TIMESTAMP(3);
ALTER TABLE "News" ADD COLUMN "notifiedAt" TIMESTAMP(3);

-- O que já está no ar já avisou (ou nasceu antes do push existir): sem isto,
-- despublicar e republicar uma notícia antiga dispararia o primeiro aviso dela.
UPDATE "News" SET "notifiedAt" = "publishedAt" WHERE "isPublished" = true;

-- O publicador consulta isto a cada 30 segundos.
CREATE INDEX "News_isPublished_scheduledAt_idx" ON "News"("isPublished", "scheduledAt");
