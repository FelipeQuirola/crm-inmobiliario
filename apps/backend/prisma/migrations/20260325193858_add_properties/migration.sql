-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('CASA', 'APARTAMENTO', 'TERRENO', 'OFICINA', 'LOCAL', 'BODEGA');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('DISPONIBLE', 'RESERVADA', 'VENDIDA', 'INACTIVA');

-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "PropertyType" NOT NULL,
    "status" "PropertyStatus" NOT NULL DEFAULT 'DISPONIBLE',
    "price" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "area" DECIMAL(10,2),
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "parking" INTEGER,
    "address" TEXT,
    "city" TEXT,
    "sector" TEXT,
    "lat" DECIMAL(10,7),
    "lng" DECIMAL(10,7),
    "features" TEXT[],
    "images" TEXT[],
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_properties" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_properties_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "properties_tenantId_status_idx" ON "properties"("tenantId", "status");

-- CreateIndex
CREATE INDEX "properties_tenantId_type_idx" ON "properties"("tenantId", "type");

-- CreateIndex
CREATE INDEX "properties_tenantId_deletedAt_idx" ON "properties"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "lead_properties_leadId_idx" ON "lead_properties"("leadId");

-- CreateIndex
CREATE INDEX "lead_properties_propertyId_idx" ON "lead_properties"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "lead_properties_leadId_propertyId_key" ON "lead_properties"("leadId", "propertyId");

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_properties" ADD CONSTRAINT "lead_properties_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_properties" ADD CONSTRAINT "lead_properties_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
