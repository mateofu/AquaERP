import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  AuditAction,
  AuditEntity,
  BillingPeriod,
  BillingPeriodStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BillingPeriodsRepository } from './billing-periods.repository';
import {
  CreateBillingPeriodDto,
  UpdateBillingPeriodDto,
} from './dto/billing-period.dto';

@Injectable()
export class BillingPeriodsService {
  constructor(
    private readonly repository: BillingPeriodsRepository,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(
    page: number,
    limit: number,
    status?: BillingPeriodStatus,
    year?: number,
  ) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.repository.findMany({ skip, take: limit, status, year }),
      this.repository.count(status, year),
    ]);
    return { data, total };
  }

  async findOne(id: string) {
    const period = await this.repository.findById(id);
    if (!period) throw new NotFoundException('Periodo no encontrado');
    return period;
  }

  async create(
    dto: CreateBillingPeriodDto,
    actorId: string,
    ipAddress?: string,
  ) {
    const existing = await this.repository.findByYearMonth(dto.year, dto.month);
    if (existing) {
      throw new ConflictException('El periodo mensual ya está registrado');
    }

    return this.prisma.$transaction(async (tx) => {
      const period = await this.repository.create(dto, tx);
      await this.auditService.log(
        {
          userId: actorId,
          action: AuditAction.CREATE,
          entity: AuditEntity.BILLING_PERIOD,
          entityId: period.id,
          changes: dto,
          ipAddress,
        },
        tx,
      );
      return period;
    });
  }

  async update(
    id: string,
    dto: UpdateBillingPeriodDto,
    actorId: string,
    ipAddress?: string,
  ) {
    const current = await this.findOne(id);
    if (current.status !== BillingPeriodStatus.DRAFT) {
      throw new UnprocessableEntityException(
        'Solo se puede modificar un periodo en borrador',
      );
    }

    const year = dto.year ?? current.year;
    const month = dto.month ?? current.month;
    if (year !== current.year || month !== current.month) {
      const existing = await this.repository.findByYearMonth(year, month);
      if (existing) {
        throw new ConflictException('El periodo mensual ya está registrado');
      }
    }

    return this.auditUpdate(id, { ...dto }, current, actorId, ipAddress);
  }

  async open(id: string, actorId: string, ipAddress?: string) {
    const current = await this.findOne(id);
    if (current.status !== BillingPeriodStatus.DRAFT) {
      throw new UnprocessableEntityException(
        'Solo se puede abrir un periodo en borrador',
      );
    }

    const active = await this.repository.findOpen();
    if (active) {
      throw new ConflictException(
        `Ya existe un periodo abierto: ${active.year}-${String(active.month).padStart(2, '0')}`,
      );
    }

    return this.auditUpdate(
      id,
      {
        status: BillingPeriodStatus.OPEN,
        openedAt: new Date(),
        closedAt: null,
      },
      current,
      actorId,
      ipAddress,
    );
  }

  async close(id: string, actorId: string, ipAddress?: string) {
    const current = await this.findOne(id);
    if (current.status !== BillingPeriodStatus.OPEN) {
      throw new UnprocessableEntityException(
        'Solo se puede cerrar un periodo abierto',
      );
    }

    return this.auditUpdate(
      id,
      { status: BillingPeriodStatus.CLOSED, closedAt: new Date() },
      current,
      actorId,
      ipAddress,
    );
  }

  private auditUpdate(
    id: string,
    data: Prisma.BillingPeriodUpdateInput,
    current: BillingPeriod,
    actorId: string,
    ipAddress?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const period = await this.repository.update(id, data, tx);
      await this.auditService.log(
        {
          userId: actorId,
          action: AuditAction.UPDATE,
          entity: AuditEntity.BILLING_PERIOD,
          entityId: period.id,
          changes: { before: current, after: period },
          ipAddress,
        },
        tx,
      );
      return period;
    });
  }
}
