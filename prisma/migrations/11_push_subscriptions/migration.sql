-- Inscrições de notificação push dos navegadores (PWA no celular).
-- Endpoint + chaves que o navegador gera; com elas o servidor envia a
-- notificação de nova notícia ou novo prazo. Canal anônimo e cancelável.

CREATE TABLE "PushSubscription" (
  "id" TEXT NOT NULL,
  "endpoint" TEXT NOT NULL,
  "p256dh" TEXT NOT NULL,
  "auth" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");
