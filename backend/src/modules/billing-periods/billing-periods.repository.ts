import { BillingPeriod, BillingPeriodStatus, Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BillingPeriodsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(params: {
    skip: number;
    take: number;
    status?: BillingPeriodStatus;
    year?: number;
  }): Promise<BillingPeriod[]> {
    return this.prisma.billingPeriod.findMany({
      where: { status: params.status, year: params.year },
      skip: params.skip,
      take: params.take,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  count(status?: BillingPeriodStatus, year?: number): Promise<number> {
    return this.prisma.billingPeriod.count({ where: { status, year } });
  }

  findById(id: string): Promise<BillingPeriod | null> {
    return this.prisma.billingPeriod.findUnique({ where: { id } });
  }

  findByYearMonth(year: number, month: number): Promise<BillingPeriod | null> {
    return this.prisma.billingPeriod.findUnique({
      where: { year_month: { year, month } },
    });
  }

  findOpen(): Promise<BillingPeriod | null> {
    return this.prisma.billingPeriod.findFirst({
      where: { status: BillingPeriodStatus.OPEN },
    });
  }

  create(
    data: Prisma.BillingPeriodCreateInput,
    client: Prisma.TransactionClient | PrismaService = this.prisma,
  ): Promise<BillingPeriod> {
    return client.billingPeriod.create({ data });
  }

  update(
    id: string,
    data: Prisma.BillingPeriodUpdateInput,
    client: Prisma.TransactionClient | PrismaService = this.prisma,
  ): Promise<BillingPeriod> {
    return client.billingPeriod.update({ where: { id }, data });
  }
}
