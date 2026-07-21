import { Injectable } from '@nestjs/common';
import { MeterReading, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const readingInclude = {
  billingPeriod: true,
  meter: {
    select: {
      id: true,
      serialNumber: true,
      brand: true,
      property: {
        select: {
          id: true,
          code: true,
          address: true,
          customer: {
            select: {
              id: true,
              documentNumber: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.MeterReadingInclude;

export type MeterReadingDetail = Prisma.MeterReadingGetPayload<{
  include: typeof readingInclude;
}>;

@Injectable()
export class MeterReadingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(params: {
    skip: number;
    take: number;
    search?: string;
    billingPeriodId?: number;
    meterId?: number;
    hasAnomaly?: boolean;
  }): Promise<MeterReadingDetail[]> {
    return this.prisma.meterReading.findMany({
      where: this.filter(params),
      skip: params.skip,
      take: params.take,
      orderBy: { readingDate: 'desc' },
      include: readingInclude,
    });
  }

  count(params: {
    search?: string;
    billingPeriodId?: number;
    meterId?: number;
    hasAnomaly?: boolean;
  }): Promise<number> {
    return this.prisma.meterReading.count({ where: this.filter(params) });
  }

  findById(id: number): Promise<MeterReadingDetail | null> {
    return this.prisma.meterReading.findUnique({
      where: { id },
      include: readingInclude,
    });
  }

  findByMeterPeriod(
    meterId: number,
    billingPeriodId: number,
  ): Promise<MeterReading | null> {
    return this.prisma.meterReading.findUnique({
      where: { meterId_billingPeriodId: { meterId, billingPeriodId } },
    });
  }

  findLatestBefore(
    meterId: number,
    year: number,
    month: number,
    excludeId?: number,
  ): Promise<MeterReading | null> {
    return this.prisma.meterReading.findFirst({
      where: {
        meterId,
        id: excludeId ? { not: excludeId } : undefined,
        OR: [
          { billingPeriod: { year: { lt: year } } },
          { billingPeriod: { year, month: { lt: month } } },
        ],
      },
      orderBy: [
        { billingPeriod: { year: 'desc' } },
        { billingPeriod: { month: 'desc' } },
      ],
    });
  }

  create(
    data: Prisma.MeterReadingCreateInput,
    client: Prisma.TransactionClient | PrismaService = this.prisma,
  ): Promise<MeterReadingDetail> {
    return client.meterReading.create({ data, include: readingInclude });
  }

  update(
    id: number,
    data: Prisma.MeterReadingUpdateInput,
    client: Prisma.TransactionClient | PrismaService = this.prisma,
  ): Promise<MeterReadingDetail> {
    return client.meterReading.update({
      where: { id },
      data,
      include: readingInclude,
    });
  }

  private filter(params: {
    search?: string;
    billingPeriodId?: number;
    meterId?: number;
    hasAnomaly?: boolean;
  }): Prisma.MeterReadingWhereInput {
    const search = params.search?.trim();
    return {
      billingPeriodId: params.billingPeriodId,
      meterId: params.meterId,
      hasAnomaly: params.hasAnomaly,
      ...(search
        ? {
            OR: [
              {
                meter: {
                  serialNumber: { contains: search, mode: 'insensitive' },
                },
              },
              {
                meter: {
                  property: {
                    code: { contains: search, mode: 'insensitive' },
                  },
                },
              },
            ],
          }
        : {}),
    };
  }
}
