import { Injectable } from '@nestjs/common';
import { Customer, DocumentType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CustomersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(params: {
    skip: number;
    take: number;
    search?: string;
    documentType?: DocumentType;
    isActive?: boolean;
    hasEmail?: boolean;
  }): Promise<Customer[]> {
    return this.prisma.customer.findMany({
      where: this.buildFilter(params.search, params),
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: 'desc' },
    });
  }

  count(
    search?: string,
    filters: {
      documentType?: DocumentType;
      isActive?: boolean;
      hasEmail?: boolean;
    } = {},
  ): Promise<number> {
    return this.prisma.customer.count({
      where: this.buildFilter(search, filters),
    });
  }

  findById(id: number): Promise<Customer | null> {
    return this.prisma.customer.findUnique({ where: { id } });
  }

  findByDocumentNumber(documentNumber: string): Promise<Customer | null> {
    return this.prisma.customer.findUnique({ where: { documentNumber } });
  }

  create(
    data: Prisma.CustomerCreateInput,
    client: Prisma.TransactionClient | PrismaService = this.prisma,
  ): Promise<Customer> {
    return client.customer.create({ data });
  }

  update(
    id: number,
    data: Prisma.CustomerUpdateInput,
    client: Prisma.TransactionClient | PrismaService = this.prisma,
  ): Promise<Customer> {
    return client.customer.update({ where: { id }, data });
  }

  private buildFilter(
    search?: string,
    filters: {
      documentType?: DocumentType;
      isActive?: boolean;
      hasEmail?: boolean;
    } = {},
  ): Prisma.CustomerWhereInput {
    const conditions: Prisma.CustomerWhereInput[] = [];

    conditions.push({ isActive: filters.isActive ?? true });

    if (filters.documentType) {
      conditions.push({ documentType: filters.documentType });
    }

    if (filters.hasEmail === true) {
      conditions.push({ email: { not: null } });
    } else if (filters.hasEmail === false) {
      conditions.push({ email: null });
    }

    if (search?.trim()) {
      const term = search.trim();
      conditions.push({
        OR: [
          { documentNumber: { contains: term, mode: 'insensitive' } },
          { firstName: { contains: term, mode: 'insensitive' } },
          { lastName: { contains: term, mode: 'insensitive' } },
          { email: { contains: term, mode: 'insensitive' } },
        ],
      });
    }

    return { AND: conditions };
  }
}
