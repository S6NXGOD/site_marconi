-- Fontes de raspagem e a origem das notícias importadas.

ALTER TABLE "News" ADD COLUMN "sourceUrl" TEXT;
ALTER TABLE "News" ADD COLUMN "sourceName" TEXT;

-- É este índice que impede a mesma matéria de entrar duas vezes. A checagem
-- feita na busca é conveniência de tela: duas importações simultâneas — ou uma
-- reimportação enquanto a outra grava — passariam por ela.
CREATE UNIQUE INDEX "News_sourceUrl_key" ON "News"("sourceUrl");

CREATE TABLE "ScrapeSource" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "category" "NewsCategory" NOT NULL DEFAULT 'PUBLICO',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "itemSelector" TEXT NOT NULL,
  "titleSelector" TEXT,
  "linkSelector" TEXT,
  "dateSelector" TEXT,
  "imageSelector" TEXT,
  "excerptSelector" TEXT,
  "contentSelector" TEXT,
  "lastRunAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ScrapeSource_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ScrapeSource_isActive_idx" ON "ScrapeSource"("isActive");
