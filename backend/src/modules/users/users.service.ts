import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, AuditEntity } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersRepository, UserWithRoles } from './users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(page: number, limit: number, search?: string) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.usersRepository.findMany({ skip, take: limit, search }),
      this.usersRepository.count(search),
    ]);

    return {
      data: users.map((user) => this.toResponse(user)),
      total,
    };
  }

  async findOne(id: number): Promise<UserResponseDto> {
    const user = await this.usersRepository.findByIdWithRoles(id);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return this.toResponse(user);
  }

  async create(
    dto: CreateUserDto,
    actorId: number,
    ipAddress?: string,
  ): Promise<UserResponseDto> {
    const existing = await this.usersRepository.findByEmailWithRoles(dto.email);

    if (existing) {
      throw new ConflictException('El correo ya está registrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    return this.prisma.$transaction(async (tx) => {
      const user = await this.usersRepository.create(
        {
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          roleNames: dto.roles,
        },
        tx,
      );

      await this.auditService.log(
        {
          userId: actorId,
          action: AuditAction.CREATE,
          entity: AuditEntity.USER,
          entityId: user.id,
          changes: { email: user.email, roles: dto.roles },
          ipAddress,
        },
        tx,
      );

      return this.toResponse(user);
    });
  }

  async update(
    id: number,
    dto: UpdateUserDto,
    actorId: number,
    ipAddress?: string,
  ): Promise<UserResponseDto> {
    const current = await this.usersRepository.findByIdWithRoles(id);

    if (!current) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (dto.email && dto.email !== current.email) {
      const existing = await this.usersRepository.findByEmailWithRoles(dto.email);

      if (existing) {
        throw new ConflictException('El correo ya está registrado');
      }
    }

    const passwordHash = dto.password
      ? await bcrypt.hash(dto.password, 12)
      : undefined;

    return this.prisma.$transaction(async (tx) => {
      const user = await this.usersRepository.update(
        id,
        {
          email: dto.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          isActive: dto.isActive,
          ...(passwordHash ? { passwordHash } : {}),
        },
        dto.roles,
        tx,
      );

      await this.auditService.log(
        {
          userId: actorId,
          action: AuditAction.UPDATE,
          entity: AuditEntity.USER,
          entityId: user.id,
          changes: {
            before: this.toResponse(current),
            after: this.toResponse(user),
            passwordChanged: Boolean(dto.password),
          },
          ipAddress,
        },
        tx,
      );

      return this.toResponse(user);
    });
  }

  async deactivate(
    id: number,
    actorId: number,
    ipAddress?: string,
  ): Promise<UserResponseDto> {
    const current = await this.usersRepository.findByIdWithRoles(id);

    if (!current) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return this.prisma.$transaction(async (tx) => {
      const user = await this.usersRepository.deactivate(id, tx);

      await this.auditService.log(
        {
          userId: actorId,
          action: AuditAction.DELETE,
          entity: AuditEntity.USER,
          entityId: user.id,
          changes: {
            before: this.toResponse(current),
            after: this.toResponse(user),
          },
          ipAddress,
        },
        tx,
      );

      return this.toResponse(user);
    });
  }

  private toResponse(user: UserWithRoles): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      roles: user.roles.map((userRole) => userRole.role.name),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
