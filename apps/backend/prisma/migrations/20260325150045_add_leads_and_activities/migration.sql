/*
  Warnings:

  - The values [GOOGLE_ADS,SITIO_WEB,REFERIDO,OTRO] on the enum `LeadSource` will be removed. If these variants are still used in the database, this will fail.
  - The values [LEAD,OPORTUNIDAD,CALIFICACION,CIERRE] on the enum `LeadStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `bathrooms` on the `leads` table. All the data in the column will be lost.
  - You are about to drop the column `bedrooms` on the `leads` table. All the data in the column will be lost.
  - You are about to drop the column `desiredLocation` on the `leads` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `leads` table. All the data in the column will be lost.
  - You are about to drop the column `lastContactedAt` on the `leads` table. All the data in the column will be lost.
  - You are about to drop the column `pipelineStageId` on the `leads` table. All the data in the column will be lost.
  - You are about to drop the column `propertyType` on the `leads` table. All the data in the column will be lost.
  - Added the required column `duplicateHash` to the `leads` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phoneNormalized` to the `leads` table without a default value. This is not possible if the table is not empty.
  - Made the column `phone` on table `leads` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('LEAD_CREATED', 'STAGE_CHANGED', 'REASSIGNED', 'STATUS_CHANGED', 'NOTE', 'CALL', 'EMAIL', 'WHATSAPP', 'MEETING');

-- AlterEnum
BEGIN;
CREATE TYPE "LeadSource_new" AS ENUM ('MANUAL', 'WEBSITE', 'FACEBOOK', 'GOOGLE', 'WHATSAPP', 'REFERRAL', 'OTHER');
ALTER TABLE "leads" ALTER COLUMN "source" DROP DEFAULT;
ALTER TABLE "leads" ALTER COLUMN "source" TYPE "LeadSource_new" USING ("source"::text::"LeadSource_new");
ALTER TYPE "LeadSource" RENAME TO "LeadSource_old";
ALTER TYPE "LeadSource_new" RENAME TO "LeadSource";
DROP TYPE "LeadSource_old";
ALTER TABLE "leads" ALTER COLUMN "source" SET DEFAULT 'MANUAL';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "LeadStatus_new" AS ENUM ('ACTIVE', 'PAUSED', 'WON', 'LOST');
ALTER TABLE "leads" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "leads" ALTER COLUMN "status" TYPE "LeadStatus_new" USING ("status"::text::"LeadStatus_new");
ALTER TYPE "LeadStatus" RENAME TO "LeadStatus_old";
ALTER TYPE "LeadStatus_new" RENAME TO "LeadStatus";
DROP TYPE "LeadStatus_old";
ALTER TABLE "leads" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- DropForeignKey
ALTER TABLE "leads" DROP CONSTRAINT "leads_pipelineStageId_fkey";

-- DropIndex
DROP INDEX "leads_tenantId_pipelineStageId_idx";

-- AlterTable
ALTER TABLE "leads" DROP COLUMN "bathrooms",
DROP COLUMN "bedrooms",
DROP COLUMN "desiredLocation",
DROP COLUMN "isActive",
DROP COLUMN "lastContactedAt",
DROP COLUMN "pipelineStageId",
DROP COLUMN "propertyType",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "duplicateHash" TEXT NOT NULL,
ADD COLUMN     "lastContactAt" TIMESTAMP(3),
ADD COLUMN     "lostReason" TEXT,
ADD COLUMN     "nextActionAt" TIMESTAMP(3),
ADD COLUMN     "phoneNormalized" TEXT NOT NULL,
ADD COLUMN     "propertyInterest" TEXT,
ADD COLUMN     "stageId" TEXT,
ALTER COLUMN "phone" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "leadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activities_leadId_idx" ON "activities"("leadId");

-- CreateIndex
CREATE INDEX "activities_tenantId_idx" ON "activities"("tenantId");

-- CreateIndex
CREATE INDEX "leads_tenantId_stageId_idx" ON "leads"("tenantId", "stageId");

-- CreateIndex
CREATE INDEX "leads_tenantId_duplicateHash_idx" ON "leads"("tenantId", "duplicateHash");

-- CreateIndex
CREATE INDEX "leads_tenantId_deletedAt_idx" ON "leads"("tenantId", "deletedAt");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "pipeline_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
