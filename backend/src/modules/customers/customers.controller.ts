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
import {
  buildPaginationMeta,
  PaginationQueryDto,
} from '../../common/dto/pagination-query.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthUser } from '../../common/types/auth-user.type';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';

const READ_ROLES = [
  RoleName.ADMIN,
  RoleName.OPERADOR,
  RoleName.CAJERO,
  RoleName.LECTOR,
  RoleName.CONSULTA,
] as const;

const WRITE_ROLES = [RoleName.ADMIN, RoleName.OPERADOR] as const;

@ApiTags('customers')
@ApiBearerAuth()
@Controller('customers')
@UseGuards(RolesGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'Lista suscriptores' })
  async findAll(@Query() query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { data, total } = await this.customersService.findAll(
      page,
      limit,
      query.search,
    );

    return {
      data,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  @Get(':id')
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'Obtiene un suscriptor por ID' })
  findOne(@Param('id') id: number) {
    return this.customersService.findOne(id);
  }

  @Post()
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Crea un suscriptor' })
  create(
    @Body() dto: CreateCustomerDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return this.customersService.create(dto, user.id, request.ip);
  }

  @Patch(':id')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Actualiza un suscriptor' })
  update(
    @Param('id') id: number,
    @Body() dto: UpdateCustomerDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return this.customersService.update(id, dto, user.id, request.ip);
  }

  @Delete(':id')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Desactiva un suscriptor' })
  deactivate(
    @Param('id') id: number,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return this.customersService.deactivate(id, user.id, request.ip);
  }
}
