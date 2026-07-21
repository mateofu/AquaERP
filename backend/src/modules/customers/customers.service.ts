import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, AuditEntity } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { CustomersRepository } from './customers.repository';

@Injectable()
export class CustomersService {
  constructor(
    private readonly customersRepository: CustomersRepository,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(page: number, limit: number, search?: string) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.customersRepository.findMany({ skip, take: limit, search }),
      this.customersRepository.count(search),
    ]);

    return { data, total };
  }

  async findOne(id: number) {
    const customer = await this.customersRepository.findById(id);

    if (!customer) {
      throw new NotFoundException('Suscriptor no encontrado');
    }

    return customer;
  }

  async create(
    dto: CreateCustomerDto,
    actorId: number,
    ipAddress?: string,
  ) {
    const existing = await this.customersRepository.findByDocumentNumber(
      dto.documentNumber,
    );

    if (existing) {
      throw new ConflictException('El número de documento ya está registrado');
    }

    return this.prisma.$transaction(async (tx) => {
      const customer = await this.customersRepository.create(dto, tx);

      await this.auditService.log(
        {
          userId: actorId,
          action: AuditAction.CREATE,
          entity: AuditEntity.CUSTOMER,
          entityId: customer.id,
          changes: dto,
          ipAddress,
        },
        tx,
      );

      return customer;
    });
  }

  async update(
    id: number,
    dto: UpdateCustomerDto,
    actorId: number,
    ipAddress?: string,
  ) {
    const current = await this.customersRepository.findById(id);

    if (!current) {
      throw new NotFoundException('Suscriptor no encontrado');
    }

    if (dto.documentNumber && dto.documentNumber !== current.documentNumber) {
      const existing = await this.customersRepository.findByDocumentNumber(
        dto.documentNumber,
      );

      if (existing) {
        throw new ConflictException('El número de documento ya está registrado');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const customer = await this.customersRepository.update(id, dto, tx);

      await this.auditService.log(
        {
          userId: actorId,
          action: AuditAction.UPDATE,
          entity: AuditEntity.CUSTOMER,
          entityId: customer.id,
          changes: { before: current, after: customer },
          ipAddress,
        },
        tx,
      );

      return customer;
    });
  }

  async deactivate(id: number, actorId: number, ipAddress?: string) {
    const current = await this.customersRepository.findById(id);

    if (!current) {
      throw new NotFoundException('Suscriptor no encontrado');
    }

    return this.prisma.$transaction(async (tx) => {
      const customer = await this.customersRepository.update(
        id,
        { isActive: false },
        tx,
      );

      await this.auditService.log(
        {
          userId: actorId,
          action: AuditAction.DELETE,
          entity: AuditEntity.CUSTOMER,
          entityId: customer.id,
          changes: { before: current, after: customer },
          ipAddress,
        },
        tx,
      );

      return customer;
    });
  }
}
