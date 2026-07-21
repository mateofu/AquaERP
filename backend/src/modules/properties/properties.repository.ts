import { Injectable } from '@nestjs/common';
import { Prisma, Property } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const propertyWithCustomerInclude = {
  customer: {
    select: {
      id: true,
      documentNumber: true,
      firstName: true,
      lastName: true,
    },
  },
} satisfies Prisma.PropertyInclude;

export type PropertyWithCustomer = Prisma.PropertyGetPayload<{
  include: typeof propertyWithCustomerInclude;
}>;

@Injectable()
export class PropertiesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(params: {
    skip: number;
    take: number;
    search?: string;
    customerId?: number;
  }): Promise<PropertyWithCustomer[]> {
    return this.prisma.property.findMany({
      where: this.buildFilter(params.search, params.customerId),
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: 'desc' },
      include: propertyWithCustomerInclude,
    });
  }

  count(search?: string, customerId?: number): Promise<number> {
    return this.prisma.property.count({
      where: this.buildFilter(search, customerId),
    });
  }

  findById(id: number): Promise<PropertyWithCustomer | null> {
    return this.prisma.property.findUnique({
      where: { id },
      include: propertyWithCustomerInclude,
    });
  }

  findByCode(code: string): Promise<Property | null> {
    return this.prisma.property.findUnique({ where: { code } });
  }

  create(
    data: Prisma.PropertyCreateInput,
    client: Prisma.TransactionClient | PrismaService = this.prisma,
  ): Promise<PropertyWithCustomer> {
    return client.property.create({
      data,
      include: propertyWithCustomerInclude,
    });
  }

  update(
    id: number,
    data: Prisma.PropertyUpdateInput,
    client: Prisma.TransactionClient | PrismaService = this.prisma,
  ): Promise<PropertyWithCustomer> {
    return client.property.update({
      where: { id },
      data,
      include: propertyWithCustomerInclude,
    });
  }

  private buildFilter(
    search?: string,
    customerId?: number,
  ): Prisma.PropertyWhereInput {
    const filters: Prisma.PropertyWhereInput[] = [{ isActive: true }];

    if (customerId) {
      filters.push({ customerId });
    }

    if (search?.trim()) {
      const term = search.trim();
      filters.push({
        OR: [
          { code: { contains: term, mode: 'insensitive' } },
          { address: { contains: term, mode: 'insensitive' } },
          { municipality: { contains: term, mode: 'insensitive' } },
          { vereda: { contains: term, mode: 'insensitive' } },
        ],
      });
    }

    return { AND: filters };
  }
}
