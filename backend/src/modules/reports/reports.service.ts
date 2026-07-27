import { BadRequestException, Injectable } from '@nestjs/common';
import {
  DocumentType,
  InvoiceStatus,
  Prisma,
} from '@prisma/client';
import ExcelJS = require('exceljs');
import { PrismaService } from '../../prisma/prisma.service';

export type ReportType =
  | 'customers'
  | 'properties'
  | 'meters'
  | 'meter-readings'
  | 'invoices'
  | 'payments';

type ReportQuery = Record<string, string | undefined>;
type Cell = ExcelJS.CellValue;

interface SheetData {
  name: string;
  title: string;
  columns: { header: string; key: string; width: number }[];
  rows: Cell[][];
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(
    type: ReportType,
    query: ReportQuery,
  ): Promise<{ file: Buffer; fileName: string }> {
    const sheets = await this.data(type, query);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'AquaERP Rural';
    workbook.created = new Date();

    for (const data of sheets) {
      this.addSheet(workbook, data);
    }

    const content = await workbook.xlsx.writeBuffer();
    return {
      file: Buffer.from(content),
      fileName: `${this.filePrefix(type)}-${this.today()}.xlsx`,
    };
  }

  private data(type: ReportType, query: ReportQuery): Promise<SheetData[]> {
    switch (type) {
      case 'customers':
        return this.customers(query);
      case 'properties':
        return this.properties(query);
      case 'meters':
        return this.meters(query);
      case 'meter-readings':
        return this.readings(query);
      case 'invoices':
        return this.invoices(query);
      case 'payments':
        return this.payments(query);
      default:
        throw new BadRequestException('Tipo de reporte no válido');
    }
  }

  private async customers(query: ReportQuery): Promise<SheetData[]> {
    const search = query.search?.trim();
    const isActive = this.boolean(query.isActive) ?? true;
    const hasEmail = this.boolean(query.hasEmail);
    const where: Prisma.CustomerWhereInput = {
      isActive,
      documentType: query.documentType as DocumentType | undefined,
      email: hasEmail === true ? { not: null } : hasEmail === false ? null : undefined,
      OR: search
        ? [
            { documentNumber: { contains: search, mode: 'insensitive' } },
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ]
        : undefined,
    };
    const values = await this.prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return [{
      name: 'Suscriptores',
      title: 'Listado de suscriptores',
      columns: this.columns([
        ['Tipo documento', 18], ['Documento', 18], ['Nombre', 28],
        ['Correo', 30], ['Teléfono', 18], ['Dirección', 32], ['Estado', 14],
      ]),
      rows: values.map((value) => [
        value.documentType, value.documentNumber,
        `${value.firstName} ${value.lastName}`, value.email ?? '',
        value.phone ?? '', value.address ?? '', value.isActive ? 'Activo' : 'Inactivo',
      ]),
    }];
  }

  private async properties(query: ReportQuery): Promise<SheetData[]> {
    const search = query.search?.trim();
    const where: Prisma.PropertyWhereInput = {
      isActive: true,
      customerId: this.number(query.customerId),
      municipality: query.municipality?.trim()
        ? { contains: query.municipality.trim(), mode: 'insensitive' }
        : undefined,
      vereda: query.vereda?.trim()
        ? { contains: query.vereda.trim(), mode: 'insensitive' }
        : undefined,
      OR: search
        ? [
            { code: { contains: search, mode: 'insensitive' } },
            { address: { contains: search, mode: 'insensitive' } },
            { municipality: { contains: search, mode: 'insensitive' } },
            { vereda: { contains: search, mode: 'insensitive' } },
          ]
        : undefined,
    };
    const values = await this.prisma.property.findMany({
      where,
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
    });
    return [{
      name: 'Predios',
      title: 'Listado de predios',
      columns: this.columns([
        ['Código', 18], ['Suscriptor', 28], ['Documento', 18],
        ['Dirección', 32], ['Municipio', 22], ['Vereda', 22], ['Estado', 14],
      ]),
      rows: values.map((value) => [
        value.code, `${value.customer.firstName} ${value.customer.lastName}`,
        value.customer.documentNumber, value.address, value.municipality,
        value.vereda, value.isActive ? 'Activo' : 'Inactivo',
      ]),
    }];
  }

  private async meters(query: ReportQuery): Promise<SheetData[]> {
    const search = query.search?.trim();
    const hasDate = this.boolean(query.hasInstallationDate);
    const where: Prisma.MeterWhereInput = {
      isActive: true,
      propertyId: this.number(query.propertyId),
      brand: query.brand?.trim()
        ? { contains: query.brand.trim(), mode: 'insensitive' }
        : undefined,
      installationDate:
        hasDate === true ? { not: null } : hasDate === false ? null : undefined,
      OR: search
        ? [
            { serialNumber: { contains: search, mode: 'insensitive' } },
            { brand: { contains: search, mode: 'insensitive' } },
          ]
        : undefined,
    };
    const values = await this.prisma.meter.findMany({
      where,
      include: { property: { include: { customer: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return [{
      name: 'Medidores',
      title: 'Listado de medidores',
      columns: this.columns([
        ['Número de serie', 22], ['Marca', 20], ['Predio', 18],
        ['Suscriptor', 28], ['Dirección', 32], ['Instalación', 16], ['Estado', 14],
      ]),
      rows: values.map((value) => [
        value.serialNumber, value.brand ?? '', value.property.code,
        `${value.property.customer.firstName} ${value.property.customer.lastName}`,
        value.property.address, this.date(value.installationDate),
        value.isActive ? 'Activo' : 'Inactivo',
      ]),
    }];
  }

  private async readings(query: ReportQuery): Promise<SheetData[]> {
    const search = query.search?.trim();
    const where: Prisma.MeterReadingWhereInput = {
      billingPeriodId: this.number(query.billingPeriodId),
      meterId: this.number(query.meterId),
      hasAnomaly: this.boolean(query.hasAnomaly),
      OR: search
        ? [
            { meter: { serialNumber: { contains: search, mode: 'insensitive' } } },
            { meter: { property: { code: { contains: search, mode: 'insensitive' } } } },
          ]
        : undefined,
    };
    const values = await this.prisma.meterReading.findMany({
      where,
      include: {
        billingPeriod: true,
        meter: { include: { property: { include: { customer: true } } } },
      },
      orderBy: { readingDate: 'desc' },
    });
    return [{
      name: 'Lecturas',
      title: 'Listado de lecturas',
      columns: this.columns([
        ['Periodo', 14], ['Medidor', 20], ['Predio', 18], ['Suscriptor', 28],
        ['Fecha', 16], ['Lectura anterior', 18], ['Lectura actual', 18],
        ['Consumo m³', 16], ['Anomalía', 14], ['Motivo', 32],
      ]),
      rows: values.map((value) => [
        `${String(value.billingPeriod.month).padStart(2, '0')}/${value.billingPeriod.year}`,
        value.meter.serialNumber, value.meter.property.code,
        `${value.meter.property.customer.firstName} ${value.meter.property.customer.lastName}`,
        this.date(value.readingDate), Number(value.previousValue),
        Number(value.readingValue), Number(value.consumption),
        value.hasAnomaly ? 'Sí' : 'No', value.anomalyReason ?? '',
      ]),
    }];
  }

  private async invoices(query: ReportQuery): Promise<SheetData[]> {
    const search = query.search?.trim();
    const where: Prisma.InvoiceWhereInput = {
      status: query.status as InvoiceStatus | undefined,
      billingPeriodId: this.number(query.billingPeriodId),
      customerId: this.number(query.customerId),
      OR: search
        ? [
            { customerName: { contains: search, mode: 'insensitive' } },
            { customerDocument: { contains: search } },
            { meterSerial: { contains: search, mode: 'insensitive' } },
          ]
        : undefined,
    };
    const values = await this.prisma.invoice.findMany({
      where,
      include: { billingPeriod: true },
      orderBy: { sequence: 'desc' },
    });
    return [{
      name: 'Facturas',
      title: 'Listado de facturas',
      columns: this.columns([
        ['Factura', 18], ['Suscriptor', 28], ['Documento', 18], ['Predio', 18],
        ['Medidor', 20], ['Periodo', 14], ['Emisión', 16], ['Vencimiento', 16],
        ['Consumo m³', 16], ['Total', 18], ['Estado', 16],
      ]),
      rows: values.map((value) => [
        `FAC-${String(value.sequence).padStart(6, '0')}`, value.customerName,
        value.customerDocument, value.propertyCode, value.meterSerial,
        `${String(value.billingPeriod.month).padStart(2, '0')}/${value.billingPeriod.year}`,
        this.date(value.issueDate), this.date(value.dueDate),
        Number(value.consumption), Number(value.total), value.status,
      ]),
    }];
  }

  private async payments(query: ReportQuery): Promise<SheetData[]> {
    const search = query.search?.trim();
    const where: Prisma.PaymentWhereInput = {
      invoiceId: this.number(query.invoiceId),
      OR: search
        ? [
            { reference: { contains: search, mode: 'insensitive' } },
            { invoice: { customerName: { contains: search, mode: 'insensitive' } } },
            { invoice: { customerDocument: { contains: search } } },
          ]
        : undefined,
    };
    const [payments, portfolio] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: {
          invoice: true,
          recordedBy: { select: { firstName: true, lastName: true } },
        },
        orderBy: [{ paymentDate: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.invoice.findMany({
        where: { status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.OVERDUE] } },
        include: { payments: { select: { amount: true } }, billingPeriod: true },
        orderBy: [{ dueDate: 'asc' }, { sequence: 'asc' }],
      }),
    ]);
    return [
      {
        name: 'Historial de recaudos',
        title: 'Historial de recaudos',
        columns: this.columns([
          ['Fecha', 16], ['Factura', 18], ['Suscriptor', 28], ['Documento', 18],
          ['Medio', 22], ['Referencia', 22], ['Valor', 18], ['Registrado por', 26],
        ]),
        rows: payments.map((value) => [
          this.date(value.paymentDate),
          `FAC-${String(value.invoice.sequence).padStart(6, '0')}`,
          value.invoice.customerName, value.invoice.customerDocument,
          value.method, value.reference ?? '', Number(value.amount),
          `${value.recordedBy.firstName} ${value.recordedBy.lastName}`,
        ]),
      },
      {
        name: 'Cartera pendiente',
        title: 'Cartera pendiente',
        columns: this.columns([
          ['Factura', 18], ['Suscriptor', 28], ['Documento', 18], ['Periodo', 14],
          ['Vencimiento', 16], ['Total', 18], ['Pagado', 18], ['Saldo', 18], ['Estado', 16],
        ]),
        rows: portfolio
          .map((value) => {
            const paid = value.payments.reduce(
              (sum, payment) => sum.add(payment.amount),
              new Prisma.Decimal(0),
            );
            return { value, paid, balance: value.total.sub(paid) };
          })
          .filter(({ balance }) => balance.gt(0))
          .map(({ value, paid, balance }) => [
            `FAC-${String(value.sequence).padStart(6, '0')}`,
            value.customerName, value.customerDocument,
            `${String(value.billingPeriod.month).padStart(2, '0')}/${value.billingPeriod.year}`,
            this.date(value.dueDate), Number(value.total), Number(paid),
            Number(balance), value.status,
          ]),
      },
    ];
  }

  private addSheet(workbook: ExcelJS.Workbook, data: SheetData): void {
    const sheet = workbook.addWorksheet(data.name, {
      views: [{ state: 'frozen', ySplit: 3 }],
    });
    sheet.mergeCells(1, 1, 1, data.columns.length);
    const title = sheet.getCell(1, 1);
    title.value = `AquaERP Rural · ${data.title}`;
    title.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4A3F' } };
    title.alignment = { vertical: 'middle', horizontal: 'left' };
    sheet.getRow(1).height = 30;

    sheet.mergeCells(2, 1, 2, data.columns.length);
    sheet.getCell(2, 1).value = `Generado: ${new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'America/Bogota',
    }).format(new Date())}`;
    sheet.getCell(2, 1).font = { italic: true, color: { argb: 'FF64736F' } };

    sheet.columns = data.columns;
    const header = sheet.getRow(3);
    data.columns.forEach((column, index) => {
      header.getCell(index + 1).value = column.header;
    });
    header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D62BD' } };
    header.alignment = { vertical: 'middle' };
    header.height = 24;

    for (const row of data.rows) {
      sheet.addRow(row);
    }
    sheet.autoFilter = {
      from: { row: 3, column: 1 },
      to: { row: Math.max(3, sheet.rowCount), column: data.columns.length },
    };
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 3 && rowNumber % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F7F5' } };
      }
      row.alignment = { vertical: 'middle' };
    });
  }

  private columns(values: [string, number][]) {
    return values.map(([header, width], index) => ({
      header,
      key: `column${index}`,
      width,
    }));
  }

  private boolean(value?: string): boolean | undefined {
    return value === 'true' ? true : value === 'false' ? false : undefined;
  }

  private number(value?: string): number | undefined {
    if (!value) return undefined;
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
  }

  private date(value: Date | null): string {
    if (!value) return '';
    return new Intl.DateTimeFormat('es-CO', {
      timeZone: 'UTC',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(value);
  }

  private today(): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  }

  private filePrefix(type: ReportType): string {
    const names: Record<ReportType, string> = {
      customers: 'suscriptores',
      properties: 'predios',
      meters: 'medidores',
      'meter-readings': 'lecturas',
      invoices: 'facturas',
      payments: 'pagos-y-cartera',
    };
    return names[type];
  }
}
