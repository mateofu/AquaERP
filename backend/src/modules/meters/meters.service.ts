import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, AuditEntity } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PropertiesRepository } from '../properties/properties.repository';
import { CreateMeterDto, UpdateMeterDto } from './dto/meter.dto';
import { MetersRepository } from './meters.repository';

@Injectable()
export class MetersService {
  constructor(
    private readonly metersRepository: MetersRepository,
    private readonly propertiesRepository: PropertiesRepository,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(
    page: number,
    limit: number,
    search?: string,
    propertyId?: string,
  ) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.metersRepository.findMany({ skip, take: limit, search, propertyId }),
      this.metersRepository.count(search, propertyId),
    ]);

    return { data, total };
  }

  async findOne(id: string) {
    const meter = await this.metersRepository.findById(id);

    if (!meter) {
      throw new NotFoundException('Medidor no encontrado');
    }

    return meter;
  }

  async create(dto: CreateMeterDto, actorId: string, ipAddress?: string) {
    const property = await this.propertiesRepository.findById(dto.propertyId);

    if (!property || !property.isActive) {
      throw new NotFoundException('Predio no encontrado');
    }

    const existing = await this.metersRepository.findBySerialNumber(
      dto.serialNumber,
    );

    if (existing) {
      throw new ConflictException('El número de serie ya está registrado');
    }

    return this.prisma.$transaction(async (tx) => {
      const meter = await this.metersRepository.create(
        {
          serialNumber: dto.serialNumber,
          brand: dto.brand,
          installationDate: dto.installationDate
            ? new Date(dto.installationDate)
            : undefined,
          property: { connect: { id: dto.propertyId } },
        },
        tx,
      );

      await this.auditService.log(
        {
          userId: actorId,
          action: AuditAction.CREATE,
          entity: AuditEntity.METER,
          entityId: meter.id,
          changes: dto,
          ipAddress,
        },
        tx,
      );

      return meter;
    });
  }

  async update(
    id: string,
    dto: UpdateMeterDto,
    actorId: string,
    ipAddress?: string,
  ) {
    const current = await this.metersRepository.findById(id);

    if (!current) {
      throw new NotFoundException('Medidor no encontrado');
    }

    if (dto.propertyId) {
      const property = await this.propertiesRepository.findById(dto.propertyId);

      if (!property || !property.isActive) {
        throw new NotFoundException('Predio no encontrado');
      }
    }

    if (dto.serialNumber && dto.serialNumber !== current.serialNumber) {
      const existing = await this.metersRepository.findBySerialNumber(
        dto.serialNumber,
      );

      if (existing) {
        throw new ConflictException('El número de serie ya está registrado');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const meter = await this.metersRepository.update(
        id,
        {
          serialNumber: dto.serialNumber,
          brand: dto.brand,
          isActive: dto.isActive,
          installationDate: dto.installationDate
            ? new Date(dto.installationDate)
            : undefined,
          ...(dto.propertyId
            ? { property: { connect: { id: dto.propertyId } } }
            : {}),
        },
        tx,
      );

      await this.auditService.log(
        {
          userId: actorId,
          action: AuditAction.UPDATE,
          entity: AuditEntity.METER,
          entityId: meter.id,
          changes: { before: current, after: meter },
          ipAddress,
        },
        tx,
      );

      return meter;
    });
  }

  async deactivate(id: string, actorId: string, ipAddress?: string) {
    const current = await this.metersRepository.findById(id);

    if (!current) {
      throw new NotFoundException('Medidor no encontrado');
    }

    return this.prisma.$transaction(async (tx) => {
      const meter = await this.metersRepository.update(
        id,
        { isActive: false },
        tx,
      );

      await this.auditService.log(
        {
          userId: actorId,
          action: AuditAction.DELETE,
          entity: AuditEntity.METER,
          entityId: meter.id,
          changes: { before: current, after: meter },
          ipAddress,
        },
        tx,
      );

      return meter;
    });
  }
}
