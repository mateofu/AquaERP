import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(RolesGuard)
export class RolesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Lista roles disponibles' })
  findAll() {
    return this.prisma.role.findMany({
      orderBy: { name: 'asc' },
    });
  }
}
