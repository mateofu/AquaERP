import { Injectable } from '@nestjs/common';
import {
  BillingPeriodStatus,
  DocumentType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface CatalogOption {
  value: string;
  label: string;
  description?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  CC: 'Cédula de ciudadanía',
  NIT: 'NIT',
  CE: 'Cédula de extranjería',
  TI: 'Tarjeta de identidad',
  PASAPORTE: 'Pasaporte',
};

const PERIOD_STATUS_LABELS: Record<BillingPeriodStatus, string> = {
  DRAFT: 'Borrador',
  OPEN: 'Abierto',
  CLOSED: 'Cerrado',
};

const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const;

@Injectable()
export class CatalogsService {
  constructor(private readonly prisma: PrismaService) {}

  documentTypes(): CatalogOption[] {
    return Object.values(DocumentType).map((value) => ({
      value,
      label: DOCUMENT_TYPE_LABELS[value],
    }));
  }

  billingPeriodStatuses(): CatalogOption[] {
    return Object.values(BillingPeriodStatus).map((value) => ({
      value,
      label: PERIOD_STATUS_LABELS[value],
    }));
  }

  async customers(search?: string, limit = 50): Promise<CatalogOption[]> {
    const term = search?.trim();
    const customers = await this.prisma.customer.findMany({
      where: {
        isActive: true,
        ...(term
          ? {
              OR: [
                { firstName: { contains: term, mode: 'insensitive' as const } },
                { lastName: { contains: term, mode: 'insensitive' as const } },
                {
                  documentNumber: {
                    contains: term,
                    mode: 'insensitive' as const,
                  },
                },
              ],
            }
          : {}),
      },
      take: limit,
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        documentNumber: true,
        documentType: true,
      },
    });

    return customers.map((customer) => ({
      value: customer.id,
      label: `${customer.firstName} ${customer.lastName}`,
      description: `${DOCUMENT_TYPE_LABELS[customer.documentType]} ${customer.documentNumber}`,
      metadata: {
        documentNumber: customer.documentNumber,
        documentType: customer.documentType,
      },
    }));
  }

  async properties(search?: string, limit = 50): Promise<CatalogOption[]> {
    const term = search?.trim();
    const properties = await this.prisma.property.findMany({
      where: {
        isActive: true,
        ...(term
          ? {
              OR: [
                { code: { contains: term, mode: 'insensitive' as const } },
                { address: { contains: term, mode: 'insensitive' as const } },
                { vereda: { contains: term, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      take: limit,
      orderBy: { code: 'asc' },
      select: {
        id: true,
        code: true,
        address: true,
        municipality: true,
        vereda: true,
        customer: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    return properties.map((property) => ({
      value: property.id,
      label: `${property.code} · ${property.address}`,
      description: `${property.vereda}, ${property.municipality}`,
      metadata: {
        customerId: property.customer.id,
        customerName: `${property.customer.firstName} ${property.customer.lastName}`,
      },
    }));
  }

  async meters(search?: string, limit = 50): Promise<CatalogOption[]> {
    const term = search?.trim();
    const meters = await this.prisma.meter.findMany({
      where: {
        isActive: true,
        ...(term
          ? {
              OR: [
                {
                  serialNumber: {
                    contains: term,
                    mode: 'insensitive' as const,
                  },
                },
                { brand: { contains: term, mode: 'insensitive' as const } },
                {
                  property: {
                    code: { contains: term, mode: 'insensitive' as const },
                  },
                },
              ],
            }
          : {}),
      },
      take: limit,
      orderBy: { serialNumber: 'asc' },
      select: {
        id: true,
        serialNumber: true,
        brand: true,
        property: { select: { id: true, code: true, address: true } },
      },
    });

    return meters.map((meter) => ({
      value: meter.id,
      label: meter.serialNumber,
      description: `${meter.property.code} · ${meter.property.address}`,
      metadata: {
        propertyId: meter.property.id,
        propertyCode: meter.property.code,
        brand: meter.brand,
      },
    }));
  }

  async billingPeriods(
    search?: string,
    limit = 50,
    status?: BillingPeriodStatus,
  ): Promise<CatalogOption[]> {
    const term = search?.trim();
    const numericYear = term && /^\d{4}$/.test(term) ? Number(term) : undefined;
    const where: Prisma.BillingPeriodWhereInput = {
      status,
      year: numericYear,
    };
    const periods = await this.prisma.billingPeriod.findMany({
      where,
      take: limit,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    return periods.map((period) => ({
      value: period.id,
      label: `${MONTHS[period.month - 1]} ${period.year}`,
      description: PERIOD_STATUS_LABELS[period.status],
      metadata: {
        year: period.year,
        month: period.month,
        status: period.status,
      },
    }));
  }
}
