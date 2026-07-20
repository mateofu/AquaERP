-- ExtendEnum
ALTER TYPE "AuditEntity" ADD VALUE 'METER_READING';

-- CreateTable
CREATE TABLE "meter_readings" (
    "id" TEXT NOT NULL,
    "meter_id" TEXT NOT NULL,
    "billing_period_id" TEXT NOT NULL,
    "reading_value" DECIMAL(12,3) NOT NULL,
    "previous_value" DECIMAL(12,3) NOT NULL,
    "consumption" DECIMAL(12,3) NOT NULL,
    "reading_date" TIMESTAMP(3) NOT NULL,
    "has_anomaly" BOOLEAN NOT NULL DEFAULT false,
    "anomaly_reason" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meter_readings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "meter_readings_values_check" CHECK (
      "reading_value" >= 0 AND "previous_value" >= 0 AND "consumption" >= 0
    )
);

-- CreateIndex
CREATE UNIQUE INDEX "meter_readings_meter_id_billing_period_id_key"
ON "meter_readings"("meter_id", "billing_period_id");

CREATE INDEX "meter_readings_billing_period_id_idx"
ON "meter_readings"("billing_period_id");

CREATE INDEX "meter_readings_meter_id_reading_date_idx"
ON "meter_readings"("meter_id", "reading_date");

CREATE INDEX "meter_readings_has_anomaly_idx"
ON "meter_readings"("has_anomaly");

-- AddForeignKey
ALTER TABLE "meter_readings"
ADD CONSTRAINT "meter_readings_meter_id_fkey"
FOREIGN KEY ("meter_id") REFERENCES "meters"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "meter_readings"
ADD CONSTRAINT "meter_readings_billing_period_id_fkey"
FOREIGN KEY ("billing_period_id") REFERENCES "billing_periods"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
