import {
  Body,
  Controller,
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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { buildPaginationMeta } from '../../common/dto/pagination-query.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthUser } from '../../common/types/auth-user.type';
import {
  CreateMeterReadingDto,
  MeterReadingQueryDto,
  UpdateMeterReadingDto,
} from './dto/meter-reading.dto';
import { MeterReadingsService } from './meter-readings.service';

const READ_ROLES = Object.values(RoleName);
const WRITE_ROLES = [RoleName.ADMIN, RoleName.OPERADOR, RoleName.LECTOR];

@ApiTags('meter-readings')
@ApiBearerAuth()
@Controller('meter-readings')
@UseGuards(RolesGuard)
export class MeterReadingsController {
  constructor(private readonly service: MeterReadingsService) {}

  @Get()
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'Lista lecturas de medidores' })
  async findAll(@Query() query: MeterReadingQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { data, total } = await this.service.findAll({
      page,
      limit,
      search: query.search,
      billingPeriodId: query.billingPeriodId,
      meterId: query.meterId,
      hasAnomaly: query.hasAnomaly,
    });
    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  @Get(':id')
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'Obtiene una lectura por ID' })
  findOne(@Param('id') id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Registra una lectura y calcula el consumo' })
  create(
    @Body() dto: CreateMeterReadingDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return this.service.create(dto, user.id, request.ip);
  }

  @Patch(':id')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Actualiza una lectura de un periodo abierto' })
  update(
    @Param('id') id: number,
    @Body() dto: UpdateMeterReadingDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return this.service.update(id, dto, user.id, request.ip);
  }
}
