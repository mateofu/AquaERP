import { ConflictException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { AuditAction, AuditEntity, InvoiceStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreatePaymentDto } from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async findAll(page: number, limit: number, search?: string, invoiceId?: number) {
    const term = search?.trim();
    const where: Prisma.PaymentWhereInput = {
      invoiceId,
      OR: term ? [
        { reference: { contains: term, mode: 'insensitive' } },
        { invoice: { customerName: { contains: term, mode: 'insensitive' } } },
        { invoice: { customerDocument: { contains: term } } },
      ] : undefined,
    };
    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: [{ paymentDate: 'desc' }, { createdAt: 'desc' }], include: { invoice: true, recordedBy: { select: { firstName: true, lastName: true } } } }),
      this.prisma.payment.count({ where }),
    ]);
    return { data, total };
  }

  async portfolio() {
    const invoices = await this.prisma.invoice.findMany({
      where: { status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.OVERDUE] } },
      include: { payments: { select: { amount: true } }, billingPeriod: true },
      orderBy: [{ dueDate: 'asc' }, { sequence: 'asc' }],
    });
    return invoices.map((invoice) => {
      const { payments, ...data } = invoice;
      const paid = payments.reduce((sum, payment) => sum.add(payment.amount), new Prisma.Decimal(0));
      return { ...data, paid, balance: invoice.total.sub(paid) };
    }).filter((invoice) => invoice.balance.gt(0));
  }

  async create(dto: CreatePaymentDto, userId: number, ipAddress?: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const invoice = await tx.invoice.findUnique({ where: { id: dto.invoiceId }, include: { payments: { select: { amount: true } } } });
        if (!invoice) throw new NotFoundException('Factura no encontrada');
        if (invoice.status !== InvoiceStatus.ISSUED && invoice.status !== InvoiceStatus.OVERDUE) {
          throw new UnprocessableEntityException('Solo se pueden pagar facturas emitidas o vencidas');
        }
        const paid = invoice.payments.reduce((sum, payment) => sum.add(payment.amount), new Prisma.Decimal(0));
        const balance = invoice.total.sub(paid);
        const amount = new Prisma.Decimal(dto.amount);
        if (amount.gt(balance)) throw new UnprocessableEntityException(`El pago supera el saldo pendiente de ${balance.toFixed(2)}`);
        const payment = await tx.payment.create({ data: { invoiceId: dto.invoiceId, amount, paymentDate: new Date(`${dto.paymentDate}T00:00:00.000Z`), method: dto.method, reference: dto.reference?.trim() || null, notes: dto.notes?.trim() || null, recordedById: userId }, include: { invoice: true } });
        const newBalance = balance.sub(amount);
        if (newBalance.eq(0)) await tx.invoice.update({ where: { id: invoice.id }, data: { status: InvoiceStatus.PAID } });
        await this.audit.log({ userId, action: AuditAction.CREATE, entity: AuditEntity.PAYMENT, entityId: payment.id, changes: { invoiceId: invoice.id, amount, previousBalance: balance, newBalance }, ipAddress }, tx);
        return { ...payment, previousBalance: balance, balance: newBalance };
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ConflictException('La referencia del pago ya existe');
      throw error;
    }
  }
}
