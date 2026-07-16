import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuditAction, AuditEntity, RoleName } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { AuthUser, JwtPayload } from '../../common/types/auth-user.type';
import { EnvConfig } from '../../config/env.validation';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UsersRepository } from '../users/users.repository';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<EnvConfig, true>,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async login(dto: LoginDto, ipAddress?: string): Promise<AuthResponseDto> {
    const user = await this.usersRepository.findByEmailWithRoles(dto.email);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const authUser = this.mapToAuthUser(user);
    const tokens = await this.issueTokens(authUser);

    await this.auditService.log({
      userId: user.id,
      action: AuditAction.LOGIN,
      entity: AuditEntity.USER,
      entityId: user.id,
      ipAddress,
    });

    return {
      ...tokens,
      user: authUser,
    };
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    const tokenHash = this.hashToken(refreshToken);

    const storedToken = await this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          include: {
            roles: {
              include: { role: true },
            },
          },
        },
      },
    });

    if (!storedToken || !storedToken.user.isActive) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    const authUser = this.mapToAuthUser(storedToken.user);
    const accessToken = await this.signAccessToken(authUser);

    return { accessToken };
  }

  async logout(
    userId: string,
    refreshToken: string,
    ipAddress?: string,
  ): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);

    await this.prisma.refreshToken.deleteMany({
      where: { userId, tokenHash },
    });

    await this.auditService.log({
      userId,
      action: AuditAction.LOGOUT,
      entity: AuditEntity.USER,
      entityId: userId,
      ipAddress,
    });
  }

  async validateUser(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.usersRepository.findByIdWithRoles(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario no autorizado');
    }

    return this.mapToAuthUser(user);
  }

  private async issueTokens(
    user: AuthUser,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = await this.signAccessToken(user);
    const refreshToken = randomBytes(48).toString('hex');
    const refreshExpiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN', {
      infer: true,
    });

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: this.addDuration(new Date(), refreshExpiresIn),
      },
    });

    return { accessToken, refreshToken };
  }

  private async signAccessToken(user: AuthUser): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    return this.jwtService.signAsync(payload);
  }

  private mapToAuthUser(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: Array<{ role: { name: RoleName } }>;
  }): AuthUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles.map((userRole) => userRole.role.name),
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private addDuration(baseDate: Date, duration: string): Date {
    const match = /^(\d+)([dhms])$/.exec(duration);

    if (!match) {
      throw new Error(`Duración JWT inválida: ${duration}`);
    }

    const value = Number(match[1]);
    const unit = match[2];
    const result = new Date(baseDate);

    switch (unit) {
      case 'd':
        result.setDate(result.getDate() + value);
        break;
      case 'h':
        result.setHours(result.getHours() + value);
        break;
      case 'm':
        result.setMinutes(result.getMinutes() + value);
        break;
      case 's':
        result.setSeconds(result.getSeconds() + value);
        break;
      default:
        throw new Error(`Unidad JWT inválida: ${unit}`);
    }

    return result;
  }
}
