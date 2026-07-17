-- A assinatura da notícia passou a ser derivada da categoria (ver `newsAuthors`
-- em src/lib/news.ts). A coluna continua existindo e é regravada a cada
-- salvamento; este backfill acerta as linhas que foram criadas quando o autor
-- ainda era um campo livre, para banco e tela não contarem histórias diferentes.
UPDATE "News"
SET "author" = CASE "category"
  WHEN 'GERAL'   THEN 'ASCOM Grupo Dr. Marconi Nunes'
  WHEN 'PRIVADO' THEN 'Redação Marconi Nunes Contabilidade'
  WHEN 'PUBLICO' THEN 'Redação CONPLAN'
END
WHERE "author" IS DISTINCT FROM CASE "category"
  WHEN 'GERAL'   THEN 'ASCOM Grupo Dr. Marconi Nunes'
  WHEN 'PRIVADO' THEN 'Redação Marconi Nunes Contabilidade'
  WHEN 'PUBLICO' THEN 'Redação CONPLAN'
END;
