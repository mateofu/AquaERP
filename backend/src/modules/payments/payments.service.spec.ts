/* eslint-disable @typescript-eslint/unbound-method */
import { UnprocessableEntityException } from '@nestjs/common';
import { InvoiceStatus, PaymentMethod, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  let tx: { invoice: { findUnique: jest.Mock; update: jest.Mock }; payment: { create: jest.Mock } };
  let service: PaymentsService;
  const invoice = { id: 1, status: InvoiceStatus.ISSUED, total: new Prisma.Decimal(100000), payments: [{ amount: new Prisma.Decimal(25000) }] };
  const dto = { invoiceId: 1, amount: 75000, paymentDate: '2026-07-22', method: PaymentMethod.CASH };

  beforeEach(() => {
    tx = { invoice: { findUnique: jest.fn().mockResolvedValue(invoice), update: jest.fn().mockResolvedValue({}) }, payment: { create: jest.fn().mockResolvedValue({ id: 1, ...dto }) } };
    const prisma = { $transaction: jest.fn((callback: (client: typeof tx) => unknown) => callback(tx)) } as unknown as PrismaService;
    const audit = { log: jest.fn().mockResolvedValue(undefined) } as unknown as AuditService;
    service = new PaymentsService(prisma, audit);
  });

  it('marca la factura como pagada cuando el abono completa el saldo', async () => {
    const result = await service.create(dto, 1);
    expect(result.balance.toString()).toBe('0');
    expect(tx.invoice.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { status: InvoiceStatus.PAID } });
  });

  it('mantiene la factura emitida cuando queda saldo pendiente', async () => {
    const result = await service.create({ ...dto, amount: 50000 }, 1);
    expect(result.balance.toString()).toBe('25000');
    expect(tx.invoice.update).not.toHaveBeenCalled();
  });

  it('rechaza pagos superiores al saldo', async () => {
    await expect(service.create({ ...dto, amount: 75000.01 }, 1)).rejects.toBeInstanceOf(UnprocessableEntityException);
  });
});
