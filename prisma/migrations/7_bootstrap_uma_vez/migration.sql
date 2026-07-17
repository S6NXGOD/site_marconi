-- O bootstrap de conteúdo decidia por "tabela vazia?". Mas vazio também é o
-- que sobra quando o admin apaga tudo de propósito — e o deploy seguinte
-- recriava as Áreas de Atuação e os contatos de WhatsApp, estes com os
-- números de exemplo, que iriam ao ar.
CREATE TABLE "SystemFlag" (
  "key" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SystemFlag_pkey" PRIMARY KEY ("key")
);

-- Banco que já tem conteúdo já passou pelo bootstrap. Marcar aqui evita que a
-- primeira execução do seed novo o considere pendente.
INSERT INTO "SystemFlag" ("key")
SELECT 'bootstrap:conteudo'
WHERE EXISTS (SELECT 1 FROM "BusinessArea")
   OR EXISTS (SELECT 1 FROM "WhatsappContact");
