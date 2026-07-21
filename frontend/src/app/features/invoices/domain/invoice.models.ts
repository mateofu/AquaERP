export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'OVERDUE' | 'VOID';
export interface InvoiceItem { id:string; type:'FIXED_CHARGE'|'CONSUMPTION'; description:string; quantity:string; unitPrice:string; amount:string; }
export interface Invoice { id:string; sequence:number; billingPeriodId:string; meterReadingId:string; status:InvoiceStatus; issueDate:string; dueDate:string; customerName:string; customerDocument:string; propertyCode:string; propertyAddress:string; meterSerial:string; previousReading:string; currentReading:string; consumption:string; subtotal:string; total:string; issuedAt:string|null; voidedAt:string|null; voidReason:string|null; items:InvoiceItem[]; billingPeriod:{year:number;month:number}; tariff?:{name:string}; }
export interface InvoicePage { data:Invoice[]; meta:{total:number;page:number;limit:number;totalPages:number}; }
export interface GenerateInvoiceInput { meterReadingId:string; issueDate?:string; dueDate?:string; }
export interface GenerateBatchInput { billingPeriodId:string; issueDate?:string; dueDate?:string; }
export interface BatchResult { total:number; generatedCount:number; errorCount:number; invoiceIds:string[]; errors:{meterReadingId:string;message:string}[]; }
export interface EligibleReading { id:string; consumption:string; meter:{serialNumber:string;property:{code:string;address:string;customer:{firstName:string;lastName:string}}}; }
export const INVOICE_STATUS_LABELS:Record<InvoiceStatus,string>={DRAFT:'Borrador',ISSUED:'Emitida',PAID:'Pagada',OVERDUE:'Vencida',VOID:'Anulada'};
