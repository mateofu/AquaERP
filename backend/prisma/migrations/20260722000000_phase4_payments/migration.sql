CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'CARD', 'OTHER');
ALTER TYPE "AuditEntity" ADD VALUE 'PAYMENT';

CREATE TABLE "payments" (
  "id" SERIAL NOT NULL,
  "invoice_id" INTEGER NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "payment_date" DATE NOT NULL,
  "method" "PaymentMethod" NOT NULL,
  "reference" TEXT,
  "notes" TEXT,
  "recorded_by_id" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payments_positive_amount_check" CHECK ("amount" > 0)
);

CREATE UNIQUE INDEX "payments_reference_key" ON "payments"("reference");
CREATE INDEX "payments_invoice_id_payment_date_idx" ON "payments"("invoice_id", "payment_date");
CREATE INDEX "payments_payment_date_idx" ON "payments"("payment_date");
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
