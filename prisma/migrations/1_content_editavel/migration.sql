-- CreateTable
CREATE TABLE "WhatsappContact" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'user',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsappContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessArea" (
    "id" TEXT NOT NULL,
    "tabLabel" TEXT NOT NULL,
    "eyebrow" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT,
    "imageAlt" TEXT NOT NULL DEFAULT '',
    "ctaLabel" TEXT NOT NULL DEFAULT 'Fale conosco',
    "ctaHref" TEXT NOT NULL DEFAULT '#contato',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessAreaService" (
    "id" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'chart',
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BusinessAreaService_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WhatsappContact_isActive_order_idx" ON "WhatsappContact"("isActive", "order");

-- CreateIndex
CREATE INDEX "BusinessArea_isActive_order_idx" ON "BusinessArea"("isActive", "order");

-- CreateIndex
CREATE INDEX "BusinessAreaService_areaId_order_idx" ON "BusinessAreaService"("areaId", "order");

-- AddForeignKey
ALTER TABLE "BusinessAreaService" ADD CONSTRAINT "BusinessAreaService_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "BusinessArea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

