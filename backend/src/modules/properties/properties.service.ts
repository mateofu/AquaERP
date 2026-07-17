import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, AuditEntity } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CustomersRepository } from '../customers/customers.repository';
import {
  CreatePropertyDto,
  UpdatePropertyDto,
} from './dto/property.dto';
import { PropertiesRepository } from './properties.repository';

@Injectable()
export class PropertiesService {
  constructor(
    private readonly propertiesRepository: PropertiesRepository,
    private readonly customersRepository: CustomersRepository,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(
    page: number,
    limit: number,
    search?: string,
    customerId?: string,
  ) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.propertiesRepository.findMany({ skip, take: limit, search, customerId }),
      this.propertiesRepository.count(search, customerId),
    ]);

    return { data, total };
  }

  async findOne(id: string) {
    const property = await this.propertiesRepository.findById(id);

    if (!property) {
      throw new NotFoundException('Predio no encontrado');
    }

    return property;
  }

  async create(
    dto: CreatePropertyDto,
    actorId: string,
    ipAddress?: string,
  ) {
    const customer = await this.customersRepository.findById(dto.customerId);

    if (!customer || !customer.isActive) {
      throw new NotFoundException('Suscriptor no encontrado');
    }

    const existing = await this.propertiesRepository.findByCode(dto.code);

    if (existing) {
      throw new ConflictException('El código de predio ya está registrado');
    }

    return this.prisma.$transaction(async (tx) => {
      const property = await this.propertiesRepository.create(
        {
          code: dto.code,
          address: dto.address,
          municipality: dto.municipality,
          vereda: dto.vereda,
          customer: { connect: { id: dto.customerId } },
        },
        tx,
      );

      await this.auditService.log(
        {
          userId: actorId,
          action: AuditAction.CREATE,
          entity: AuditEntity.PROPERTY,
          entityId: property.id,
          changes: dto,
          ipAddress,
        },
        tx,
      );

      return property;
    });
  }

  async update(
    id: string,
    dto: UpdatePropertyDto,
    actorId: string,
    ipAddress?: string,
  ) {
    const current = await this.propertiesRepository.findById(id);

    if (!current) {
      throw new NotFoundException('Predio no encontrado');
    }

    if (dto.customerId) {
      const customer = await this.customersRepository.findById(dto.customerId);

      if (!customer || !customer.isActive) {
        throw new NotFoundException('Suscriptor no encontrado');
      }
    }

    if (dto.code && dto.code !== current.code) {
      const existing = await this.propertiesRepository.findByCode(dto.code);

      if (existing) {
        throw new ConflictException('El código de predio ya está registrado');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const property = await this.propertiesRepository.update(
        id,
        {
          code: dto.code,
          address: dto.address,
          municipality: dto.municipality,
          vereda: dto.vereda,
          isActive: dto.isActive,
          ...(dto.customerId
            ? { customer: { connect: { id: dto.customerId } } }
            : {}),
        },
        tx,
      );

      await this.auditService.log(
        {
          userId: actorId,
          action: AuditAction.UPDATE,
          entity: AuditEntity.PROPERTY,
          entityId: property.id,
          changes: { before: current, after: property },
          ipAddress,
        },
        tx,
      );

      return property;
    });
  }

  async deactivate(id: string, actorId: string, ipAddress?: string) {
    const current = await this.propertiesRepository.findById(id);

    if (!current) {
      throw new NotFoundException('Predio no encontrado');
    }

    return this.prisma.$transaction(async (tx) => {
      const property = await this.propertiesRepository.update(
        id,
        { isActive: false },
        tx,
      );

      await this.auditService.log(
        {
          userId: actorId,
          action: AuditAction.DELETE,
          entity: AuditEntity.PROPERTY,
          entityId: property.id,
          changes: { before: current, after: property },
          ipAddress,
        },
        tx,
      );

      return property;
    });
  }
}
