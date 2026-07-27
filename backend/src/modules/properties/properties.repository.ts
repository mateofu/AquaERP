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
    municipality?: string;
    vereda?: string;
  }): Promise<PropertyWithCustomer[]> {
    return this.prisma.property.findMany({
      where: this.buildFilter(params.search, params),
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: 'desc' },
      include: propertyWithCustomerInclude,
    });
  }

  count(
    search?: string,
    filters: {
      customerId?: number;
      municipality?: string;
      vereda?: string;
    } = {},
  ): Promise<number> {
    return this.prisma.property.count({
      where: this.buildFilter(search, filters),
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
    selected: {
      customerId?: number;
      municipality?: string;
      vereda?: string;
    } = {},
  ): Prisma.PropertyWhereInput {
    const filters: Prisma.PropertyWhereInput[] = [{ isActive: true }];

    if (selected.customerId) {
      filters.push({ customerId: selected.customerId });
    }

    if (selected.municipality?.trim()) {
      filters.push({
        municipality: {
          contains: selected.municipality.trim(),
          mode: 'insensitive',
        },
      });
    }

    if (selected.vereda?.trim()) {
      filters.push({
        vereda: {
          contains: selected.vereda.trim(),
          mode: 'insensitive',
        },
      });
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
