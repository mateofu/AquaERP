export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'OTHER';

export interface PortfolioInvoice {
  id: string; sequence: number; customerName: string; customerDocument: string;
  propertyCode: string; meterSerial: string; dueDate: string; total: string;
  paid: string; balance: string; status: 'ISSUED' | 'OVERDUE';
  billingPeriod: { year: number; month: number };
}

export interface Payment {
  id: string; invoiceId: string; amount: string; paymentDate: string;
  method: PaymentMethod; reference?: string; notes?: string; createdAt: string;
  invoice: PortfolioInvoice;
  recordedBy: { firstName: string; lastName: string };
}

export interface PaymentPage { data: Payment[]; meta: { page: number; totalPages: number; total: number } }
export interface CreatePaymentInput { invoiceId: string; amount: number; paymentDate: string; method: PaymentMethod; reference?: string; notes?: string }

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Efectivo', BANK_TRANSFER: 'Transferencia bancaria', CARD: 'Tarjeta', OTHER: 'Otro',
};
