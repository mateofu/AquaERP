import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { Request } from 'express';
import { buildPaginationMeta } from '../../common/dto/pagination-query.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthUser } from '../../common/types/auth-user.type';
import {
  CreatePropertyDto,
  PropertyQueryDto,
  UpdatePropertyDto,
} from './dto/property.dto';
import { PropertiesService } from './properties.service';

const READ_ROLES = [
  RoleName.ADMIN,
  RoleName.OPERADOR,
  RoleName.CAJERO,
  RoleName.LECTOR,
  RoleName.CONSULTA,
] as const;

const WRITE_ROLES = [RoleName.ADMIN, RoleName.OPERADOR] as const;

@ApiTags('properties')
@ApiBearerAuth()
@Controller('properties')
@UseGuards(RolesGuard)
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'Lista predios' })
  async findAll(@Query() query: PropertyQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { data, total } = await this.propertiesService.findAll(
      page,
      limit,
      query.search,
      query.customerId,
    );

    return {
      data,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  @Get(':id')
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'Obtiene un predio por ID' })
  findOne(@Param('id') id: number) {
    return this.propertiesService.findOne(id);
  }

  @Post()
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Crea un predio' })
  create(
    @Body() dto: CreatePropertyDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return this.propertiesService.create(dto, user.id, request.ip);
  }

  @Patch(':id')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Actualiza un predio' })
  update(
    @Param('id') id: number,
    @Body() dto: UpdatePropertyDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return this.propertiesService.update(id, dto, user.id, request.ip);
  }

  @Delete(':id')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Desactiva un predio' })
  deactivate(
    @Param('id') id: number,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return this.propertiesService.deactivate(id, user.id, request.ip);
  }
}
