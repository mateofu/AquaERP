import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { buildPaginationMeta } from '../../common/dto/pagination-query.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreatePaymentDto, PaymentQueryDto } from './dto/payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('payments') @ApiBearerAuth() @Controller('payments') @UseGuards(RolesGuard)
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Get() @Roles(...Object.values(RoleName))
  async findAll(@Query() query: PaymentQueryDto) {
    const page = query.page ?? 1, limit = query.limit ?? 20;
    const { data, total } = await this.service.findAll(page, limit, query.search, query.invoiceId);
    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  @Get('portfolio') @Roles(...Object.values(RoleName))
  portfolio() { return this.service.portfolio(); }

  @Post() @Roles(RoleName.ADMIN, RoleName.CAJERO)
  @ApiOperation({ summary: 'Registra un abono o pago total sobre una factura emitida' })
  create(@Body() dto: CreatePaymentDto, @CurrentUser() user: AuthUser, @Req() request: Request) {
    return this.service.create(dto, user.id, request.ip);
  }
}
