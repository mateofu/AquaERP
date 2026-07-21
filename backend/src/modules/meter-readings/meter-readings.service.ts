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
import { BillingPeriodsRepository } from '../billing-periods/billing-periods.repository';
import {
  CreateMeterReadingDto,
  UpdateMeterReadingDto,
} from './dto/meter-reading.dto';
import { MeterReadingsRepository } from './meter-readings.repository';

@Injectable()
export class MeterReadingsService {
  constructor(
    private readonly repository: MeterReadingsRepository,
    private readonly periodsRepository: BillingPeriodsRepository,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    billingPeriodId?: number;
    meterId?: number;
    hasAnomaly?: boolean;
  }) {
    const { page, limit, ...filters } = params;
    const [data, total] = await Promise.all([
      this.repository.findMany({
        skip: (page - 1) * limit,
        take: limit,
        ...filters,
      }),
      this.repository.count(filters),
    ]);
    return { data, total };
  }

  async findOne(id: number) {
    const reading = await this.repository.findById(id);
    if (!reading) throw new NotFoundException('Lectura no encontrada');
    return reading;
  }

  async create(
    dto: CreateMeterReadingDto,
    actorId: number,
    ipAddress?: string,
  ) {
    const period = await this.requireOpenPeriod(dto.billingPeriodId);
    await this.requireActiveMeter(dto.meterId);
    this.validateReadingDate(dto.readingDate, period);

    const existing = await this.repository.findByMeterPeriod(
      dto.meterId,
      dto.billingPeriodId,
    );
    if (existing) {
      throw new ConflictException(
        'El medidor ya tiene una lectura en este periodo',
      );
    }

    const calculated = await this.calculate(
      dto.meterId,
      period,
      dto.readingValue,
    );
    return this.prisma.$transaction(async (tx) => {
      const reading = await this.repository.create(
        {
          readingValue: new Prisma.Decimal(dto.readingValue),
          previousValue: calculated.previousValue,
          consumption: calculated.consumption,
          readingDate: new Date(dto.readingDate),
          hasAnomaly: calculated.hasAnomaly,
          anomalyReason: calculated.anomalyReason,
          notes: dto.notes,
          meter: { connect: { id: dto.meterId } },
          billingPeriod: { connect: { id: dto.billingPeriodId } },
        },
        tx,
      );
      await this.auditService.log(
        {
          userId: actorId,
          action: AuditAction.CREATE,
          entity: AuditEntity.METER_READING,
          entityId: reading.id,
          changes: dto,
          ipAddress,
        },
        tx,
      );
      return reading;
    });
  }

  async update(
    id: number,
    dto: UpdateMeterReadingDto,
    actorId: number,
    ipAddress?: string,
  ) {
    const current = await this.findOne(id);
    const meterId = dto.meterId ?? current.meterId;
    const billingPeriodId =
      dto.billingPeriodId ?? current.billingPeriodId;
    const period = await this.requireOpenPeriod(billingPeriodId);
    await this.requireActiveMeter(meterId);

    const readingDate =
      dto.readingDate ?? current.readingDate.toISOString();
    this.validateReadingDate(readingDate, period);

    if (
      meterId !== current.meterId ||
      billingPeriodId !== current.billingPeriodId
    ) {
      const existing = await this.repository.findByMeterPeriod(
        meterId,
        billingPeriodId,
      );
      if (existing && existing.id !== id) {
        throw new ConflictException(
          'El medidor ya tiene una lectura en este periodo',
        );
      }
    }

    const readingValue = dto.readingValue ?? current.readingValue.toNumber();
    const calculated = await this.calculate(
      meterId,
      period,
      readingValue,
      id,
    );

    return this.prisma.$transaction(async (tx) => {
      const reading = await this.repository.update(
        id,
        {
          readingValue: new Prisma.Decimal(readingValue),
          previousValue: calculated.previousValue,
          consumption: calculated.consumption,
          readingDate: new Date(readingDate),
          hasAnomaly: calculated.hasAnomaly,
          anomalyReason: calculated.anomalyReason,
          notes: dto.notes,
          meter: { connect: { id: meterId } },
          billingPeriod: { connect: { id: billingPeriodId } },
        },
        tx,
      );
      await this.auditService.log(
        {
          userId: actorId,
          action: AuditAction.UPDATE,
          entity: AuditEntity.METER_READING,
          entityId: reading.id,
          changes: { before: current, after: reading },
          ipAddress,
        },
        tx,
      );
      return reading;
    });
  }

  private async calculate(
    meterId: number,
    period: BillingPeriod,
    readingValue: number,
    excludeId?: number,
  ) {
    const previous = await this.repository.findLatestBefore(
      meterId,
      period.year,
      period.month,
      excludeId,
    );
    const previousValue = previous?.readingValue ?? new Prisma.Decimal(0);
    const currentValue = new Prisma.Decimal(readingValue);
    if (currentValue.lessThan(previousValue)) {
      throw new UnprocessableEntityException(
        `La lectura no puede ser menor a la anterior (${previousValue.toString()})`,
      );
    }

    const consumption = currentValue.minus(previousValue);
    const previousConsumption = previous?.consumption;
    const hasAnomaly = Boolean(
      previousConsumption?.greaterThan(0) &&
        consumption.greaterThan(previousConsumption.times(2)),
    );
    return {
      previousValue,
      consumption,
      hasAnomaly,
      anomalyReason: hasAnomaly
        ? 'El consumo supera el doble del periodo anterior'
        : null,
    };
  }

  private async requireOpenPeriod(id: number): Promise<BillingPeriod> {
    const period = await this.periodsRepository.findById(id);
    if (!period) throw new NotFoundException('Periodo no encontrado');
    if (period.status !== BillingPeriodStatus.OPEN) {
      throw new UnprocessableEntityException(
        'Las lecturas solo se registran en un periodo abierto',
      );
    }
    return period;
  }

  private async requireActiveMeter(id: number): Promise<void> {
    const meter = await this.prisma.meter.findUnique({ where: { id } });
    if (!meter || !meter.isActive) {
      throw new NotFoundException('Medidor no encontrado');
    }
  }

  private validateReadingDate(dateValue: string, period: BillingPeriod): void {
    const date = new Date(dateValue);
    if (
      date.getUTCFullYear() !== period.year ||
      date.getUTCMonth() + 1 !== period.month
    ) {
      throw new UnprocessableEntityException(
        'La fecha de lectura debe pertenecer al mes del periodo',
      );
    }
  }
}
