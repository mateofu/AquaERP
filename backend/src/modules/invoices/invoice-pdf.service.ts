import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { InvoiceStatus } from '@prisma/client';
import JSZip = require('jszip');
import PDFDocument = require('pdfkit');
import { InvoicesService } from './invoices.service';

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT: 'BORRADOR',
  ISSUED: 'EMITIDA',
  PAID: 'PAGADA',
  OVERDUE: 'VENCIDA',
  VOID: 'ANULADA',
};

@Injectable()
export class InvoicePdfService {
  constructor(private readonly invoices: InvoicesService) {}

  async generate(id: number): Promise<Buffer> {
    return this.generateInvoice(await this.invoices.findOne(id));
  }

  async generateBatch(
    billingPeriodId: number,
    part: number,
    size: number,
  ): Promise<{ file: Buffer; count: number }> {
    const values = await this.invoices.findBatchDocuments(
      billingPeriodId,
      (part - 1) * size,
      size,
      true,
    );
    if (!values.length) {
      throw new UnprocessableEntityException(
        'No hay facturas emitidas en esta parte del lote',
      );
    }
    const document = this.createDocument(`Facturación masiva · parte ${part}`);
    const completed = this.collect(document);
    values.forEach((invoice, index) => {
      if (index > 0) document.addPage();
      this.render(document, invoice);
    });
    document.end();
    return { file: await completed, count: values.length };
  }

  async generateZip(billingPeriodId: number): Promise<{ file: Buffer; count: number }> {
    const values = await this.invoices.findBatchDocuments(
      billingPeriodId,
      0,
      undefined,
      true,
    );
    if (!values.length) {
      throw new UnprocessableEntityException(
        'No hay facturas emitidas para descargar en este periodo',
      );
    }
    const zip = new JSZip();
    for (const invoice of values) {
      zip.file(
        `${this.invoiceNumber(invoice.sequence)}.pdf`,
        await this.generateInvoice(invoice),
      );
    }
    return {
      file: await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      }),
      count: values.length,
    };
  }

  private async generateInvoice(
    invoice: Awaited<ReturnType<InvoicesService['findOne']>>,
  ): Promise<Buffer> {
    const document = this.createDocument(
      `Factura ${this.invoiceNumber(invoice.sequence)}`,
    );
    const completed = this.collect(document);
    this.render(document, invoice);
    document.end();
    return completed;
  }

  private createDocument(title: string): PDFKit.PDFDocument {
    return new PDFDocument({
      size: 'A4',
      margin: 48,
      info: {
        Title: title,
        Author: 'AquaERP Rural',
        Subject: 'Factura de servicio de acueducto',
      },
    });
  }

  private collect(document: PDFKit.PDFDocument): Promise<Buffer> {
    const chunks: Buffer[] = [];
    document.on('data', (chunk: Buffer) => chunks.push(chunk));

    return new Promise<Buffer>((resolve, reject) => {
      document.on('end', () => resolve(Buffer.concat(chunks)));
      document.on('error', reject);
    });
  }

  private render(
    document: PDFKit.PDFDocument,
    invoice: Awaited<ReturnType<InvoicesService['findOne']>>,
  ): void {
    const blue = '#2d62bd';
    const green = '#1f4a3f';
    const muted = '#64736f';
    const width = document.page.width - 96;

    document.roundedRect(48, 42, width, 82, 12).fill('#eef5f2');
    document
      .fillColor(green)
      .font('Helvetica-Bold')
      .fontSize(22)
      .text('AquaERP Rural', 68, 62);
    document
      .fillColor(muted)
      .font('Helvetica')
      .fontSize(10)
      .text('Gestión integral del servicio de acueducto', 68, 91);
    document
      .fillColor(blue)
      .font('Helvetica-Bold')
      .fontSize(15)
      .text(this.invoiceNumber(invoice.sequence), 365, 61, {
        width: 160,
        align: 'right',
      });
    document
      .fillColor(green)
      .fontSize(10)
      .text(STATUS_LABELS[invoice.status], 365, 89, {
        width: 160,
        align: 'right',
      });

    this.sectionTitle(document, 'Información de facturación', 148);
    this.labelValue(document, 'Suscriptor', invoice.customerName, 48, 174, 245);
    this.labelValue(document, 'Documento', invoice.customerDocument, 300, 174, 245);
    this.labelValue(document, 'Predio', invoice.propertyCode, 48, 218, 245);
    this.labelValue(document, 'Dirección', invoice.propertyAddress, 300, 218, 245);
    this.labelValue(document, 'Medidor', invoice.meterSerial, 48, 262, 160);
    this.labelValue(
      document,
      'Periodo',
      `${String(invoice.billingPeriod.month).padStart(2, '0')}/${invoice.billingPeriod.year}`,
      215,
      262,
      160,
    );
    this.labelValue(document, 'Emisión', this.date(invoice.issueDate), 382, 262, 163);
    this.labelValue(document, 'Vencimiento', this.date(invoice.dueDate), 382, 306, 163);

    this.sectionTitle(document, 'Detalle del consumo', 362);
    this.tableHeader(document, 390);
    let y = 418;
    for (const item of invoice.items) {
      document
        .fillColor('#334b44')
        .font('Helvetica')
        .fontSize(9)
        .text(item.description, 56, y, { width: 215 })
        .text(this.number(item.quantity), 278, y, { width: 70, align: 'right' })
        .text(this.currency(item.unitPrice), 355, y, { width: 90, align: 'right' })
        .text(this.currency(item.amount), 452, y, { width: 90, align: 'right' });
      y += 27;
      document.moveTo(52, y - 8).lineTo(543, y - 8).strokeColor('#e4eae8').stroke();
    }

    y += 8;
    document
      .fillColor(green)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text('TOTAL A PAGAR', 340, y, { width: 105, align: 'right' })
      .fillColor(blue)
      .fontSize(14)
      .text(this.currency(invoice.total), 452, y - 2, { width: 90, align: 'right' });

    const summaryY = Math.max(y + 46, 545);
    document.roundedRect(48, summaryY, width, 86, 10).fill('#f7f9f8');
    this.labelValue(document, 'Lectura anterior', this.number(invoice.previousReading), 64, summaryY + 16, 115);
    this.labelValue(document, 'Lectura actual', this.number(invoice.currentReading), 190, summaryY + 16, 115);
    this.labelValue(document, 'Consumo', `${this.number(invoice.consumption)} m³`, 316, summaryY + 16, 100);
    this.labelValue(document, 'Tarifa', invoice.tariff?.name ?? 'Tarifa vigente', 427, summaryY + 16, 105);

    if (invoice.status === InvoiceStatus.VOID && invoice.voidReason) {
      document
        .fillColor('#a53f35')
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Factura anulada: ${invoice.voidReason}`, 48, summaryY + 104, {
          width,
          align: 'center',
        });
    }

    document
      .fillColor(muted)
      .font('Helvetica')
      .fontSize(8)
      .text(
        'Documento generado electrónicamente por AquaERP Rural. Conserve esta factura para sus registros.',
        48,
        document.page.height - document.page.margins.bottom - 22,
        { width, align: 'center' },
      );
  }

  private sectionTitle(document: PDFKit.PDFDocument, title: string, y: number): void {
    document
      .fillColor('#1f4a3f')
      .font('Helvetica-Bold')
      .fontSize(11)
      .text(title, 48, y);
    document.moveTo(48, y + 17).lineTo(547, y + 17).strokeColor('#cddbd6').stroke();
  }

  private labelValue(
    document: PDFKit.PDFDocument,
    label: string,
    value: string,
    x: number,
    y: number,
    width: number,
  ): void {
    document
      .fillColor('#75837f')
      .font('Helvetica')
      .fontSize(8)
      .text(label.toUpperCase(), x, y, { width })
      .fillColor('#263f38')
      .font('Helvetica-Bold')
      .fontSize(10)
      .text(value, x, y + 13, { width, ellipsis: true });
  }

  private tableHeader(document: PDFKit.PDFDocument, y: number): void {
    document.roundedRect(48, y, 499, 22, 4).fill('#2d62bd');
    document
      .fillColor('#ffffff')
      .font('Helvetica-Bold')
      .fontSize(8)
      .text('CONCEPTO', 56, y + 7, { width: 215 })
      .text('CANTIDAD', 278, y + 7, { width: 70, align: 'right' })
      .text('VALOR UNITARIO', 355, y + 7, { width: 90, align: 'right' })
      .text('SUBTOTAL', 452, y + 7, { width: 90, align: 'right' });
  }

  private invoiceNumber(sequence: number): string {
    return `FAC-${String(sequence).padStart(6, '0')}`;
  }

  private currency(value: { toString(): string }): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number(value.toString()));
  }

  private number(value: { toString(): string }): string {
    return new Intl.NumberFormat('es-CO', {
      maximumFractionDigits: 3,
    }).format(Number(value.toString()));
  }

  private date(value: Date): string {
    return new Intl.DateTimeFormat('es-CO', {
      timeZone: 'UTC',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(value);
  }
}
