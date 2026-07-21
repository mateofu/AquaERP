/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-assignment */
import { ConflictException, UnprocessableEntityException } from '@nestjs/common';
import { BillingPeriodStatus, InvoiceStatus, Prisma, TariffStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { InvoicesService } from './invoices.service';

describe('InvoicesService', () => {
  const reading = {
    id: 1, meterId: 1, billingPeriodId: 1,
    readingValue: new Prisma.Decimal(25), previousValue: new Prisma.Decimal(15),
    consumption: new Prisma.Decimal(10),
    billingPeriod: { id: 1, year: 2026, month: 7, status: BillingPeriodStatus.CLOSED },
    meter: { serialNumber: 'M-001', property: { code: 'P-001', address: 'Vereda Centro', customer: { id: 1, firstName: 'Ana', lastName: 'Rural', documentNumber: '123' } } },
  };
  const tariff = { id: 1, name: 'General', status: TariffStatus.ACTIVE, fixedCharge: new Prisma.Decimal(15000), pricePerCubicMeter: new Prisma.Decimal(1800) };
  let tx: { meterReading: { findUnique: jest.Mock }; tariff: { findFirst: jest.Mock }; invoice: { create: jest.Mock; update: jest.Mock } };
  let service: InvoicesService;

  beforeEach(() => {
    tx = { meterReading: { findUnique: jest.fn().mockResolvedValue(reading) }, tariff: { findFirst: jest.fn().mockResolvedValue(tariff) }, invoice: { create: jest.fn().mockImplementation(({ data }: { data: Prisma.InvoiceCreateInput }) => Promise.resolve({ id: 1, status: InvoiceStatus.DRAFT, ...data, items: [] })), update: jest.fn() } };
    const prisma = { $transaction: jest.fn((callback: (client: unknown) => Promise<unknown>) => callback(tx)) } as unknown as PrismaService;
    const audit = { log: jest.fn().mockResolvedValue(undefined) } as unknown as AuditService;
    service = new InvoicesService(prisma, audit);
  });

  it('calcula cargo fijo, consumo y total usando valores decimales', async () => {
    const result = await service.generate({ meterReadingId: 1, issueDate: '2026-07-31', dueDate: '2026-08-15' }, 1);
    expect(result.total.toString()).toBe('33000');
    expect(tx.invoice.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ subtotal: expect.objectContaining({}), total: expect.objectContaining({}) }) }));
  });

  it('rechaza lecturas de periodos que no están cerrados', async () => {
    tx.meterReading.findUnique.mockResolvedValue({ ...reading, billingPeriod: { ...reading.billingPeriod, status: BillingPeriodStatus.OPEN } });
    await expect(service.generate({ meterReadingId: 1 }, 1)).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('traduce una restricción única en conflicto de negocio', async () => {
    tx.invoice.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('duplicate', { code: 'P2002', clientVersion: '6.19.3' }));
    await expect(service.generate({ meterReadingId: 1 }, 1)).rejects.toBeInstanceOf(ConflictException);
  });
});
