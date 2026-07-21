import { ConflictException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { AuditAction, AuditEntity, Prisma, TariffStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateTariffDto, UpdateTariffDto } from './dto/tariff.dto';

@Injectable()
export class TariffsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}
  async findAll(page: number, limit: number, search?: string, status?: TariffStatus) {
    const where: Prisma.TariffWhereInput = { status, name: search?.trim() ? { contains: search.trim(), mode: 'insensitive' } : undefined };
    const [data, total] = await Promise.all([this.prisma.tariff.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { validFrom: 'desc' } }), this.prisma.tariff.count({ where })]);
    return { data, total };
  }
  async findOne(id: string) { const value = await this.prisma.tariff.findUnique({ where: { id } }); if (!value) throw new NotFoundException('Tarifa no encontrada'); return value; }
  async create(dto: CreateTariffDto, userId: string, ipAddress?: string) {
    const dates = this.dates(dto.validFrom, dto.validTo);
    return this.prisma.$transaction(async (tx) => { const value = await tx.tariff.create({ data: { name: dto.name.trim(), fixedCharge: dto.fixedCharge, pricePerCubicMeter: dto.pricePerCubicMeter, ...dates } }); await this.audit.log({ userId, action: AuditAction.CREATE, entity: AuditEntity.TARIFF, entityId: value.id, changes: dto, ipAddress }, tx); return value; });
  }
  async update(id: string, dto: UpdateTariffDto, userId: string, ipAddress?: string) {
    const current = await this.findOne(id); if (current.status !== TariffStatus.DRAFT) throw new UnprocessableEntityException('Solo se puede modificar una tarifa en borrador');
    const dates = this.dates(dto.validFrom ?? current.validFrom.toISOString().slice(0, 10), dto.validTo === undefined ? current.validTo?.toISOString().slice(0, 10) : dto.validTo);
    return this.change(id, { name: dto.name?.trim(), fixedCharge: dto.fixedCharge, pricePerCubicMeter: dto.pricePerCubicMeter, ...dates }, current, userId, ipAddress);
  }
  async activate(id: string, userId: string, ipAddress?: string) {
    const current = await this.findOne(id); if (current.status !== TariffStatus.DRAFT) throw new UnprocessableEntityException('Solo se puede activar una tarifa en borrador');
    const overlap = await this.prisma.tariff.findFirst({ where: { id: { not: id }, status: TariffStatus.ACTIVE, validFrom: { lte: current.validTo ?? new Date('9999-12-31') }, OR: [{ validTo: null }, { validTo: { gte: current.validFrom } }] } });
    if (overlap) throw new ConflictException(`La vigencia se superpone con la tarifa activa "${overlap.name}"`);
    return this.change(id, { status: TariffStatus.ACTIVE }, current, userId, ipAddress);
  }
  async retire(id: string, userId: string, ipAddress?: string) { const current = await this.findOne(id); if (current.status !== TariffStatus.ACTIVE) throw new UnprocessableEntityException('Solo se puede retirar una tarifa activa'); return this.change(id, { status: TariffStatus.RETIRED }, current, userId, ipAddress); }
  private dates(from: string, to?: string) { const validFrom = new Date(`${from}T00:00:00Z`); const validTo = to ? new Date(`${to}T00:00:00Z`) : null; if (validTo && validTo < validFrom) throw new UnprocessableEntityException('La fecha final debe ser igual o posterior a la fecha inicial'); return { validFrom, validTo }; }
  private change(id: string, data: Prisma.TariffUpdateInput, before: object, userId: string, ipAddress?: string) { return this.prisma.$transaction(async (tx) => { const value = await tx.tariff.update({ where: { id }, data }); await this.audit.log({ userId, action: AuditAction.UPDATE, entity: AuditEntity.TARIFF, entityId: id, changes: { before, after: value }, ipAddress }, tx); return value; }); }
}
