-- Seletor opcional da categoria na listagem da fonte. A categoria raspada
-- (ex.: "Serviços" na Receita) vira uma tag sugerida na notícia importada.
ALTER TABLE "ScrapeSource" ADD COLUMN "categorySelector" TEXT;
