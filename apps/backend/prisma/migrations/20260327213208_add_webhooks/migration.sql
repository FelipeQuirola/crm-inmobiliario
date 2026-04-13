-- CreateEnum
CREATE TYPE "WebhookProvider" AS ENUM ('FACEBOOK', 'GOOGLE', 'OTHER');

-- CreateEnum
CREATE TYPE "WebhookStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED', 'DUPLICATE');

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "provider" "WebhookProvider" NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "WebhookStatus" NOT NULL DEFAULT 'PENDING',
    "leadId" TEXT,
    "errorMessage" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facebook_page_configs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "pageName" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "facebook_page_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "webhook_events_tenantId_idx" ON "webhook_events"("tenantId");

-- CreateIndex
CREATE INDEX "webhook_events_provider_status_idx" ON "webhook_events"("provider", "status");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_providerEventId_provider_key" ON "webhook_events"("providerEventId", "provider");

-- CreateIndex
CREATE INDEX "facebook_page_configs_tenantId_idx" ON "facebook_page_configs"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "facebook_page_configs_pageId_key" ON "facebook_page_configs"("pageId");

-- AddForeignKey
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facebook_page_configs" ADD CONSTRAINT "facebook_page_configs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
