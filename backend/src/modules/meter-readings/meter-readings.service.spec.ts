/* eslint-disable @typescript-eslint/unbound-method */
import { UnprocessableEntityException } from '@nestjs/common';
import {
  BillingPeriod,
  BillingPeriodStatus,
  Meter,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BillingPeriodsRepository } from '../billing-periods/billing-periods.repository';
import { MeterReadingsRepository } from './meter-readings.repository';
import { MeterReadingsService } from './meter-readings.service';

describe('MeterReadingsService', () => {
  let service: MeterReadingsService;
  let repository: jest.Mocked<MeterReadingsRepository>;
  let periodsRepository: jest.Mocked<BillingPeriodsRepository>;
  let auditService: jest.Mocked<AuditService>;

  const period = (
    status: BillingPeriodStatus = BillingPeriodStatus.OPEN,
  ): BillingPeriod => ({
    id: 1,
    year: 2026,
    month: 7,
    status,
    openedAt: new Date(),
    closedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const meter: Meter = {
    id: 1,
    propertyId: 1,
    serialNumber: 'M-001',
    brand: null,
    installationDate: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    repository = {
      findMany: jest.fn(),
      count: jest.fn(),
      findById: jest.fn(),
      findByMeterPeriod: jest.fn(),
      findLatestBefore: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<MeterReadingsRepository>;
    periodsRepository = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<BillingPeriodsRepository>;
    auditService = {
      log: jest.fn(),
    } as unknown as jest.Mocked<AuditService>;
    const prisma = {
      meter: { findUnique: jest.fn().mockResolvedValue(meter) },
      $transaction: jest.fn(
        (
          callback: (
            client: Prisma.TransactionClient,
          ) => Promise<unknown>,
        ) => callback({} as Prisma.TransactionClient),
      ),
    } as unknown as PrismaService;
    service = new MeterReadingsService(
      repository,
      periodsRepository,
      auditService,
      prisma,
    );
  });

  it('calculates first consumption from zero', async () => {
    periodsRepository.findById.mockResolvedValue(period());
    repository.findByMeterPeriod.mockResolvedValue(null);
    repository.findLatestBefore.mockResolvedValue(null);
    repository.create.mockImplementation((data) =>
      Promise.resolve({
        id: 1,
        meterId: meter.id,
        billingPeriodId: period().id,
        readingValue: data.readingValue as Prisma.Decimal,
        previousValue: data.previousValue as Prisma.Decimal,
        consumption: data.consumption as Prisma.Decimal,
        readingDate: data.readingDate as Date,
        hasAnomaly: false,
        anomalyReason: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        meter: {
          id: meter.id,
          serialNumber: meter.serialNumber,
          brand: null,
          property: {
            id: 1,
            code: 'P-001',
            address: 'Vereda',
            customer: {
              id: 1,
              documentNumber: '1',
              firstName: 'Ana',
              lastName: 'Rural',
            },
          },
        },
        billingPeriod: period(),
      }),
    );

    const result = await service.create(
      {
        meterId: meter.id,
        billingPeriodId: period().id,
        readingValue: 125,
        readingDate: '2026-07-20',
      },
      1,
    );

    expect(result.previousValue.toNumber()).toBe(0);
    expect(result.consumption.toNumber()).toBe(125);
    expect(auditService.log).toHaveBeenCalledTimes(1);
  });

  it('rejects readings outside an open period', async () => {
    periodsRepository.findById.mockResolvedValue(
      period(BillingPeriodStatus.CLOSED),
    );

    await expect(
      service.create(
        {
          meterId: meter.id,
          billingPeriodId: period().id,
          readingValue: 125,
          readingDate: '2026-07-20',
        },
        1,
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('rejects a value lower than the previous reading', async () => {
    periodsRepository.findById.mockResolvedValue(period());
    repository.findByMeterPeriod.mockResolvedValue(null);
    repository.findLatestBefore.mockResolvedValue({
      id: 2,
      meterId: meter.id,
      billingPeriodId: 2,
      readingValue: new Prisma.Decimal(150),
      previousValue: new Prisma.Decimal(100),
      consumption: new Prisma.Decimal(50),
      readingDate: new Date(),
      hasAnomaly: false,
      anomalyReason: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      service.create(
        {
          meterId: meter.id,
          billingPeriodId: period().id,
          readingValue: 140,
          readingDate: '2026-07-20',
        },
        1,
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });
});
