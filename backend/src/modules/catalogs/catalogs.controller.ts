import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CatalogsService } from './catalogs.service';
import {
  BillingPeriodCatalogQueryDto,
  CatalogQueryDto,
} from './dto/catalog-query.dto';

@ApiTags('catalogs')
@ApiBearerAuth()
@Controller('catalogs')
export class CatalogsController {
  constructor(private readonly service: CatalogsService) {}

  @Get('document-types')
  @ApiOperation({ summary: 'Opciones de tipos de documento' })
  documentTypes() {
    return { data: this.service.documentTypes() };
  }

  @Get('billing-period-statuses')
  @ApiOperation({ summary: 'Opciones de estados de periodo' })
  billingPeriodStatuses() {
    return { data: this.service.billingPeriodStatuses() };
  }

  @Get('customers')
  @ApiOperation({ summary: 'Opciones de suscriptores activos' })
  async customers(@Query() query: CatalogQueryDto) {
    return {
      data: await this.service.customers(query.search, query.limit),
    };
  }

  @Get('properties')
  @ApiOperation({ summary: 'Opciones de predios activos' })
  async properties(@Query() query: CatalogQueryDto) {
    return {
      data: await this.service.properties(query.search, query.limit),
    };
  }

  @Get('meters')
  @ApiOperation({ summary: 'Opciones de medidores activos' })
  async meters(@Query() query: CatalogQueryDto) {
    return {
      data: await this.service.meters(query.search, query.limit),
    };
  }

  @Get('billing-periods')
  @ApiOperation({ summary: 'Opciones de periodos mensuales' })
  async billingPeriods(@Query() query: BillingPeriodCatalogQueryDto) {
    return {
      data: await this.service.billingPeriods(
        query.search,
        query.limit,
        query.status,
      ),
    };
  }
}
