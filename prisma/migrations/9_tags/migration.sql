-- Tags livres de assunto (IRPF 2026, Impostos…), reaproveitáveis entre
-- notícias. A vertente (News.category) continua existindo — a tag é o assunto,
-- a categoria é o setor.

CREATE TABLE "Tag" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");
CREATE INDEX "Tag_slug_idx" ON "Tag"("slug");

-- Tabela de junção implícita do Prisma (News <-> Tag).
-- A = News (vem antes em ordem alfabética), B = Tag.
CREATE TABLE "_NewsToTag" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL
);
CREATE UNIQUE INDEX "_NewsToTag_AB_unique" ON "_NewsToTag"("A", "B");
CREATE INDEX "_NewsToTag_B_index" ON "_NewsToTag"("B");
ALTER TABLE "_NewsToTag" ADD CONSTRAINT "_NewsToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "News"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_NewsToTag" ADD CONSTRAINT "_NewsToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
