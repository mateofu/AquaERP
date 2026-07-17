import { Injectable } from '@nestjs/common';
import { Prisma, RoleName } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const userWithRolesInclude = {
  roles: {
    include: {
      role: true,
    },
  },
} satisfies Prisma.UserInclude;

export type UserWithRoles = Prisma.UserGetPayload<{
  include: typeof userWithRolesInclude;
}>;

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmailWithRoles(email: string): Promise<UserWithRoles | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: userWithRolesInclude,
    });
  }

  findByIdWithRoles(id: string): Promise<UserWithRoles | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: userWithRolesInclude,
    });
  }

  findMany(params: {
    skip: number;
    take: number;
    search?: string;
  }): Promise<UserWithRoles[]> {
    const where = this.buildSearchFilter(params.search);

    return this.prisma.user.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: 'desc' },
      include: userWithRolesInclude,
    });
  }

  count(search?: string): Promise<number> {
    return this.prisma.user.count({
      where: this.buildSearchFilter(search),
    });
  }

  create(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    roleNames: RoleName[];
  }, client: Prisma.TransactionClient | PrismaService = this.prisma): Promise<UserWithRoles> {
    return client.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        roles: {
          create: data.roleNames.map((roleName) => ({
            role: {
              connect: { name: roleName },
            },
          })),
        },
      },
      include: userWithRolesInclude,
    });
  }

  update(
    id: string,
    data: Prisma.UserUpdateInput,
    roleNames?: RoleName[],
    client?: Prisma.TransactionClient,
  ): Promise<UserWithRoles> {
    if (client) {
      return this.updateWithClient(client, id, data, roleNames);
    }

    return this.prisma.$transaction((tx) =>
      this.updateWithClient(tx, id, data, roleNames),
    );
  }

  deactivate(
    id: string,
    client: Prisma.TransactionClient | PrismaService = this.prisma,
  ): Promise<UserWithRoles> {
    return client.user.update({
      where: { id },
      data: { isActive: false },
      include: userWithRolesInclude,
    });
  }

  private async updateWithClient(
    client: Prisma.TransactionClient,
    id: string,
    data: Prisma.UserUpdateInput,
    roleNames?: RoleName[],
  ): Promise<UserWithRoles> {
    if (roleNames) {
      await client.userRole.deleteMany({ where: { userId: id } });
      const roles = await client.role.findMany({
        where: { name: { in: roleNames } },
        select: { id: true },
      });
      await client.userRole.createMany({
        data: roles.map((role) => ({ userId: id, roleId: role.id })),
      });
    }

    return client.user.update({
      where: { id },
      data,
      include: userWithRolesInclude,
    });
  }

  private buildSearchFilter(search?: string): Prisma.UserWhereInput | undefined {
    if (!search?.trim()) {
      return undefined;
    }

    const term = search.trim();

    return {
      OR: [
        { email: { contains: term, mode: 'insensitive' } },
        { firstName: { contains: term, mode: 'insensitive' } },
        { lastName: { contains: term, mode: 'insensitive' } },
      ],
    };
  }
}
