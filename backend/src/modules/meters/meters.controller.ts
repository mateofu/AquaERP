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
import { CreateMeterDto, MeterQueryDto, UpdateMeterDto } from './dto/meter.dto';
import { MetersService } from './meters.service';

const READ_ROLES = [
  RoleName.ADMIN,
  RoleName.OPERADOR,
  RoleName.CAJERO,
  RoleName.LECTOR,
  RoleName.CONSULTA,
] as const;

const WRITE_ROLES = [RoleName.ADMIN, RoleName.OPERADOR] as const;

@ApiTags('meters')
@ApiBearerAuth()
@Controller('meters')
@UseGuards(RolesGuard)
export class MetersController {
  constructor(private readonly metersService: MetersService) {}

  @Get()
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'Lista medidores' })
  async findAll(@Query() query: MeterQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { data, total } = await this.metersService.findAll(
      page,
      limit,
      query.search,
      query.propertyId,
    );

    return {
      data,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  @Get(':id')
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'Obtiene un medidor por ID' })
  findOne(@Param('id') id: number) {
    return this.metersService.findOne(id);
  }

  @Post()
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Crea un medidor' })
  create(
    @Body() dto: CreateMeterDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return this.metersService.create(dto, user.id, request.ip);
  }

  @Patch(':id')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Actualiza un medidor' })
  update(
    @Param('id') id: number,
    @Body() dto: UpdateMeterDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return this.metersService.update(id, dto, user.id, request.ip);
  }

  @Delete(':id')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Desactiva un medidor' })
  deactivate(
    @Param('id') id: number,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return this.metersService.deactivate(id, user.id, request.ip);
  }
}
