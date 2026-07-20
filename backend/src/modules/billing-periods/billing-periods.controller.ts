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
import { BillingPeriodsService } from './billing-periods.service';
import {
  BillingPeriodQueryDto,
  CreateBillingPeriodDto,
  UpdateBillingPeriodDto,
} from './dto/billing-period.dto';

const READ_ROLES = Object.values(RoleName);
const WRITE_ROLES = [RoleName.ADMIN, RoleName.OPERADOR];

@ApiTags('billing-periods')
@ApiBearerAuth()
@Controller('billing-periods')
@UseGuards(RolesGuard)
export class BillingPeriodsController {
  constructor(private readonly service: BillingPeriodsService) {}

  @Get()
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'Lista periodos mensuales' })
  async findAll(@Query() query: BillingPeriodQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { data, total } = await this.service.findAll(
      page,
      limit,
      query.status,
      query.year,
    );
    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  @Get(':id')
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'Obtiene un periodo mensual' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Crea un periodo mensual en borrador' })
  create(
    @Body() dto: CreateBillingPeriodDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return this.service.create(dto, user.id, request.ip);
  }

  @Patch(':id')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Modifica un periodo en borrador' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBillingPeriodDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return this.service.update(id, dto, user.id, request.ip);
  }

  @Post(':id/open')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Abre un periodo mensual' })
  open(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return this.service.open(id, user.id, request.ip);
  }

  @Post(':id/close')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Cierra un periodo mensual' })
  close(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return this.service.close(id, user.id, request.ip);
  }
}
