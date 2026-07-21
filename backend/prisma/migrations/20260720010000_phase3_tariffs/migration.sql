-- CreateEnum
CREATE TYPE "TariffStatus" AS ENUM ('DRAFT', 'ACTIVE', 'RETIRED');

-- AlterEnum
ALTER TYPE "AuditEntity" ADD VALUE 'TARIFF';

-- CreateTable
CREATE TABLE "tariffs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fixed_charge" DECIMAL(14,2) NOT NULL,
    "price_per_cubic_meter" DECIMAL(14,2) NOT NULL,
    "valid_from" DATE NOT NULL,
    "valid_to" DATE,
    "status" "TariffStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tariffs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tariffs_status_idx" ON "tariffs"("status");

-- CreateIndex
CREATE INDEX "tariffs_valid_from_valid_to_idx" ON "tariffs"("valid_from", "valid_to");

-- AddConstraint
ALTER TABLE "tariffs"
ADD CONSTRAINT "tariffs_valid_dates_check"
CHECK ("valid_to" IS NULL OR "valid_to" >= "valid_from");

-- AddConstraint
ALTER TABLE "tariffs"
ADD CONSTRAINT "tariffs_non_negative_amounts_check"
CHECK ("fixed_charge" >= 0 AND "price_per_cubic_meter" >= 0);
