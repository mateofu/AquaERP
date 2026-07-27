import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { Response } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ReportType, ReportsService } from './reports.service';

const REPORT_TYPES: ReportType[] = [
  'customers',
  'properties',
  'meters',
  'meter-readings',
  'invoices',
  'payments',
];

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(RolesGuard)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get(':type/excel')
  @Roles(...Object.values(RoleName))
  @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @ApiOperation({ summary: 'Exporta un listado filtrado a Excel' })
  async excel(
    @Param('type') type: string,
    @Query() query: Record<string, string | undefined>,
    @Res() response: Response,
  ): Promise<void> {
    if (!REPORT_TYPES.includes(type as ReportType)) {
      throw new BadRequestException('Tipo de reporte no válido');
    }

    const report = await this.reports.generate(type as ReportType, query);
    response.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${report.fileName}"`,
    );
    response.setHeader('Content-Length', String(report.file.length));
    response.send(report.file);
  }
}
