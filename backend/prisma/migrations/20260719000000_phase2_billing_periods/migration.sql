-- ExtendEnum
ALTER TYPE "AuditEntity" ADD VALUE 'BILLING_PERIOD';

-- CreateEnum
CREATE TYPE "BillingPeriodStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "billing_periods" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "status" "BillingPeriodStatus" NOT NULL DEFAULT 'DRAFT',
    "opened_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_periods_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "billing_periods_month_check" CHECK ("month" BETWEEN 1 AND 12),
    CONSTRAINT "billing_periods_year_check" CHECK ("year" BETWEEN 2000 AND 2100)
);

-- CreateIndex
CREATE UNIQUE INDEX "billing_periods_year_month_key"
ON "billing_periods"("year", "month");

-- CreateIndex
CREATE INDEX "billing_periods_status_idx" ON "billing_periods"("status");

-- Only one operational period may be open at a time.
CREATE UNIQUE INDEX "billing_periods_single_open_idx"
ON "billing_periods"("status")
WHERE "status" = 'OPEN';
