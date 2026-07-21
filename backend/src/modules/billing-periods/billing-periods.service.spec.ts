import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
/* eslint-disable @typescript-eslint/unbound-method */
import {
  BillingPeriod,
  BillingPeriodStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BillingPeriodsRepository } from './billing-periods.repository';
import { BillingPeriodsService } from './billing-periods.service';

describe('BillingPeriodsService', () => {
  let service: BillingPeriodsService;
  let repository: jest.Mocked<BillingPeriodsRepository>;
  let auditService: jest.Mocked<AuditService>;

  const period = (
    status: BillingPeriodStatus = BillingPeriodStatus.DRAFT,
  ): BillingPeriod => ({
    id: 1,
    year: 2026,
    month: 7,
    status,
    openedAt: status === BillingPeriodStatus.DRAFT ? null : new Date(),
    closedAt: status === BillingPeriodStatus.CLOSED ? new Date() : null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    repository = {
      findMany: jest.fn(),
      count: jest.fn(),
      findById: jest.fn(),
      findByYearMonth: jest.fn(),
      findOpen: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<BillingPeriodsRepository>;
    auditService = {
      log: jest.fn(),
    } as unknown as jest.Mocked<AuditService>;
    const prisma = {
      $transaction: jest.fn(
        (
          callback: (
            client: Prisma.TransactionClient,
          ) => Promise<unknown>,
        ) => callback({} as Prisma.TransactionClient),
      ),
    } as unknown as PrismaService;

    service = new BillingPeriodsService(repository, auditService, prisma);
  });

  it('creates a monthly period as draft and audits it', async () => {
    repository.findByYearMonth.mockResolvedValue(null);
    repository.create.mockResolvedValue(period());

    const result = await service.create(
      { year: 2026, month: 7 },
      1,
      '127.0.0.1',
    );

    expect(result.status).toBe(BillingPeriodStatus.DRAFT);
    expect(repository.create).toHaveBeenCalledWith(
      { year: 2026, month: 7 },
      expect.anything(),
    );
    expect(auditService.log).toHaveBeenCalledTimes(1);
  });

  it('rejects a duplicate year and month', async () => {
    repository.findByYearMonth.mockResolvedValue(period());

    await expect(
      service.create({ year: 2026, month: 7 }, 1),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('opens a draft when there is no other open period', async () => {
    repository.findById.mockResolvedValue(period());
    repository.findOpen.mockResolvedValue(null);
    repository.update.mockImplementation((_id, data) =>
      Promise.resolve({
        ...period(),
        status: data.status as BillingPeriodStatus,
        openedAt: data.openedAt as Date,
      }),
    );

    const result = await service.open(1, 1);

    expect(result.status).toBe(BillingPeriodStatus.OPEN);
    expect(repository.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ status: BillingPeriodStatus.OPEN }),
      expect.anything(),
    );
  });

  it('rejects opening when another period is open', async () => {
    repository.findById.mockResolvedValue(period());
    repository.findOpen.mockResolvedValue({
      ...period(BillingPeriodStatus.OPEN),
      id: 2,
    });

    await expect(service.open(1, 1)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('only closes an open period', async () => {
    repository.findById.mockResolvedValue(period());

    await expect(service.close(1, 1)).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
  });

  it('returns not found for an unknown period', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
