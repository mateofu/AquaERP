import { Injectable } from '@nestjs/common';
import { Customer, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CustomersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(params: {
    skip: number;
    take: number;
    search?: string;
    includeInactive?: boolean;
  }): Promise<Customer[]> {
    return this.prisma.customer.findMany({
      where: this.buildFilter(params.search, params.includeInactive),
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: 'desc' },
    });
  }

  count(search?: string, includeInactive?: boolean): Promise<number> {
    return this.prisma.customer.count({
      where: this.buildFilter(search, includeInactive),
    });
  }

  findById(id: string): Promise<Customer | null> {
    return this.prisma.customer.findUnique({ where: { id } });
  }

  findByDocumentNumber(documentNumber: string): Promise<Customer | null> {
    return this.prisma.customer.findUnique({ where: { documentNumber } });
  }

  create(data: Prisma.CustomerCreateInput): Promise<Customer> {
    return this.prisma.customer.create({ data });
  }

  update(id: string, data: Prisma.CustomerUpdateInput): Promise<Customer> {
    return this.prisma.customer.update({ where: { id }, data });
  }

  private buildFilter(
    search?: string,
    includeInactive?: boolean,
  ): Prisma.CustomerWhereInput {
    const filters: Prisma.CustomerWhereInput[] = [];

    if (!includeInactive) {
      filters.push({ isActive: true });
    }

    if (search?.trim()) {
      const term = search.trim();
      filters.push({
        OR: [
          { documentNumber: { contains: term, mode: 'insensitive' } },
          { firstName: { contains: term, mode: 'insensitive' } },
          { lastName: { contains: term, mode: 'insensitive' } },
          { email: { contains: term, mode: 'insensitive' } },
        ],
      });
    }

    return filters.length > 0 ? { AND: filters } : {};
  }
}
