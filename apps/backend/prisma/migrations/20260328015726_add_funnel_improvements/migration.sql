-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "daysInCurrentStage" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lossReasonId" TEXT;

-- AlterTable
ALTER TABLE "pipeline_stages" ADD COLUMN     "description" TEXT,
ADD COLUMN     "probability" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "loss_reasons" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loss_reasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_stage_history" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "stageId" TEXT,
    "stageName" TEXT NOT NULL,
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exitedAt" TIMESTAMP(3),
    "daysInStage" INTEGER,

    CONSTRAINT "lead_stage_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stage_checklists" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stage_checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_checklist_progress" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "checklistId" TEXT NOT NULL,
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "doneAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_checklist_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "loss_reasons_tenantId_idx" ON "loss_reasons"("tenantId");

-- CreateIndex
CREATE INDEX "lead_stage_history_leadId_idx" ON "lead_stage_history"("leadId");

-- CreateIndex
CREATE INDEX "lead_stage_history_tenantId_idx" ON "lead_stage_history"("tenantId");

-- CreateIndex
CREATE INDEX "stage_checklists_stageId_idx" ON "stage_checklists"("stageId");

-- CreateIndex
CREATE INDEX "stage_checklists_tenantId_idx" ON "stage_checklists"("tenantId");

-- CreateIndex
CREATE INDEX "lead_checklist_progress_leadId_idx" ON "lead_checklist_progress"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "lead_checklist_progress_leadId_checklistId_key" ON "lead_checklist_progress"("leadId", "checklistId");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_lossReasonId_fkey" FOREIGN KEY ("lossReasonId") REFERENCES "loss_reasons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loss_reasons" ADD CONSTRAINT "loss_reasons_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_stage_history" ADD CONSTRAINT "lead_stage_history_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_stage_history" ADD CONSTRAINT "lead_stage_history_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "pipeline_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_checklists" ADD CONSTRAINT "stage_checklists_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_checklists" ADD CONSTRAINT "stage_checklists_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "pipeline_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_checklist_progress" ADD CONSTRAINT "lead_checklist_progress_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_checklist_progress" ADD CONSTRAINT "lead_checklist_progress_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "stage_checklists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
