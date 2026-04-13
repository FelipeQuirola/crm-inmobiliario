-- CreateEnum
CREATE TYPE "LeadTemperature" AS ENUM ('COLD', 'WARM', 'HOT');

-- CreateTable
CREATE TABLE "lead_scores" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "temperature" "LeadTemperature" NOT NULL,
    "factors" JSONB NOT NULL,
    "reasoning" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL DEFAULT '',
    "urgency" TEXT NOT NULL DEFAULT 'MEDIA',
    "positiveSignals" TEXT[],
    "negativeSignals" TEXT[],
    "geminiAnalysis" TEXT,
    "lastCalculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scoring_feedback" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "finalStatus" "LeadStatus" NOT NULL,
    "scoreAtClose" INTEGER NOT NULL,
    "factors" JSONB NOT NULL,
    "lossReasonId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scoring_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lead_scores_leadId_key" ON "lead_scores"("leadId");

-- CreateIndex
CREATE INDEX "lead_scores_tenantId_temperature_idx" ON "lead_scores"("tenantId", "temperature");

-- CreateIndex
CREATE INDEX "lead_scores_tenantId_score_idx" ON "lead_scores"("tenantId", "score");

-- CreateIndex
CREATE INDEX "scoring_feedback_tenantId_idx" ON "scoring_feedback"("tenantId");

-- CreateIndex
CREATE INDEX "scoring_feedback_tenantId_finalStatus_idx" ON "scoring_feedback"("tenantId", "finalStatus");

-- AddForeignKey
ALTER TABLE "lead_scores" ADD CONSTRAINT "lead_scores_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_scores" ADD CONSTRAINT "lead_scores_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scoring_feedback" ADD CONSTRAINT "scoring_feedback_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scoring_feedback" ADD CONSTRAINT "scoring_feedback_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scoring_feedback" ADD CONSTRAINT "scoring_feedback_lossReasonId_fkey" FOREIGN KEY ("lossReasonId") REFERENCES "loss_reasons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
