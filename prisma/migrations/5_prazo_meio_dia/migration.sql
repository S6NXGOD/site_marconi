-- Os prazos foram gravados à meia-noite UTC, que já é o dia ANTERIOR em
-- UTC-3: um prazo cadastrado para 20/07 aparecia como 19/07 para quem acessa
-- de Teresina. Um dia de erro numa tela que existe justamente para prazos.
--
-- Passa tudo para o meio-dia UTC, que não cruza a virada do dia em nenhum
-- fuso. O dia pretendido é preservado (o valor gravado já era o dia digitado,
-- só que na hora errada).
--
-- Idempotente: meio-dia truncado para o dia e somado de 12h continua meio-dia.
UPDATE "Alert"
SET "date" = date_trunc('day', "date") + interval '12 hours';
