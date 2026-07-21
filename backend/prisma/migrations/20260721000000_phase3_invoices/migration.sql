CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'OVERDUE', 'VOID');
CREATE TYPE "InvoiceItemType" AS ENUM ('FIXED_CHARGE', 'CONSUMPTION');
ALTER TYPE "AuditEntity" ADD VALUE 'INVOICE';
CREATE TABLE "invoices" (
  "id" TEXT NOT NULL, "sequence" SERIAL NOT NULL,
  "billing_period_id" TEXT NOT NULL, "meter_reading_id" TEXT NOT NULL,
  "meter_id" TEXT NOT NULL, "customer_id" TEXT NOT NULL, "tariff_id" TEXT NOT NULL,
  "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
  "issue_date" DATE NOT NULL, "due_date" DATE NOT NULL,
  "customer_name" TEXT NOT NULL, "customer_document" TEXT NOT NULL,
  "property_code" TEXT NOT NULL, "property_address" TEXT NOT NULL, "meter_serial" TEXT NOT NULL,
  "previous_reading" DECIMAL(12,3) NOT NULL, "current_reading" DECIMAL(12,3) NOT NULL,
  "consumption" DECIMAL(12,3) NOT NULL, "subtotal" DECIMAL(14,2) NOT NULL, "total" DECIMAL(14,2) NOT NULL,
  "issued_at" TIMESTAMP(3), "voided_at" TIMESTAMP(3), "void_reason" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "invoices_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "invoices_dates_check" CHECK ("due_date" >= "issue_date"),
  CONSTRAINT "invoices_amounts_check" CHECK ("subtotal" >= 0 AND "total" >= 0)
);
CREATE TABLE "invoice_items" (
  "id" TEXT NOT NULL, "invoice_id" TEXT NOT NULL, "type" "InvoiceItemType" NOT NULL,
  "description" TEXT NOT NULL, "quantity" DECIMAL(12,3) NOT NULL,
  "unit_price" DECIMAL(14,2) NOT NULL, "amount" DECIMAL(14,2) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "invoices_sequence_key" ON "invoices"("sequence");
CREATE UNIQUE INDEX "invoices_meter_reading_id_key" ON "invoices"("meter_reading_id");
CREATE UNIQUE INDEX "invoices_meter_id_billing_period_id_key" ON "invoices"("meter_id", "billing_period_id");
CREATE INDEX "invoices_billing_period_id_status_idx" ON "invoices"("billing_period_id", "status");
CREATE INDEX "invoices_customer_id_idx" ON "invoices"("customer_id");
CREATE INDEX "invoice_items_invoice_id_idx" ON "invoice_items"("invoice_id");
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_billing_period_id_fkey" FOREIGN KEY ("billing_period_id") REFERENCES "billing_periods"("id");
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_meter_reading_id_fkey" FOREIGN KEY ("meter_reading_id") REFERENCES "meter_readings"("id");
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_meter_id_fkey" FOREIGN KEY ("meter_id") REFERENCES "meters"("id");
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id");
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tariff_id_fkey" FOREIGN KEY ("tariff_id") REFERENCES "tariffs"("id");
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE;
