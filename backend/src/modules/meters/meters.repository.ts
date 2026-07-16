import { Injectable } from '@nestjs/common';
import { Meter, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const meterWithPropertyInclude = {
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
} satisfies Prisma.MeterInclude;

export type MeterWithProperty = Prisma.MeterGetPayload<{
  include: typeof meterWithPropertyInclude;
}>;

@Injectable()
export class MetersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(params: {
    skip: number;
    take: number;
    search?: string;
    propertyId?: string;
  }): Promise<MeterWithProperty[]> {
    return this.prisma.meter.findMany({
      where: this.buildFilter(params.search, params.propertyId),
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: 'desc' },
      include: meterWithPropertyInclude,
    });
  }

  count(search?: string, propertyId?: string): Promise<number> {
    return this.prisma.meter.count({
      where: this.buildFilter(search, propertyId),
    });
  }

  findById(id: string): Promise<MeterWithProperty | null> {
    return this.prisma.meter.findUnique({
      where: { id },
      include: meterWithPropertyInclude,
    });
  }

  findBySerialNumber(serialNumber: string): Promise<Meter | null> {
    return this.prisma.meter.findUnique({ where: { serialNumber } });
  }

  create(data: Prisma.MeterCreateInput): Promise<MeterWithProperty> {
    return this.prisma.meter.create({
      data,
      include: meterWithPropertyInclude,
    });
  }

  update(id: string, data: Prisma.MeterUpdateInput): Promise<MeterWithProperty> {
    return this.prisma.meter.update({
      where: { id },
      data,
      include: meterWithPropertyInclude,
    });
  }

  private buildFilter(
    search?: string,
    propertyId?: string,
  ): Prisma.MeterWhereInput {
    const filters: Prisma.MeterWhereInput[] = [{ isActive: true }];

    if (propertyId) {
      filters.push({ propertyId });
    }

    if (search?.trim()) {
      const term = search.trim();
      filters.push({
        OR: [
          { serialNumber: { contains: term, mode: 'insensitive' } },
          { brand: { contains: term, mode: 'insensitive' } },
        ],
      });
    }

    return { AND: filters };
  }
}
