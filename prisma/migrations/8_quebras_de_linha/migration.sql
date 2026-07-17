-- Notícia editada pelo painel chegava ao banco com CRLF: o <textarea>
-- normaliza o value para \r\n na submissão do formulário (especificação do
-- HTML). A separação de parágrafos procurava dois \n grudados, que não casa
-- com \r\n\r\n — havia um \r no meio —, e a matéria virava um bloco único.
--
-- A gravação passou a normalizar e a leitura ficou tolerante, mas as linhas
-- já gravadas continuariam com \r no texto. Aqui elas ficam limpas.
UPDATE "News"
SET "content" = replace("content", E'\r\n', E'\n'),
    "excerpt" = replace("excerpt", E'\r\n', E'\n')
WHERE "content" LIKE '%' || E'\r' || '%'
   OR "excerpt" LIKE '%' || E'\r' || '%';

UPDATE "Alert"
SET "description" = replace("description", E'\r\n', E'\n')
WHERE "description" LIKE '%' || E'\r' || '%';
