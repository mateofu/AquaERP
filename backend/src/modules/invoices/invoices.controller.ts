import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { Request, Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { buildPaginationMeta } from '../../common/dto/pagination-query.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthUser } from '../../common/types/auth-user.type';
import {
  GenerateInvoiceBatchDto,
  GenerateInvoiceDto,
  InvoiceBatchDocumentQueryDto,
  InvoiceBatchDto,
  InvoiceQueryDto,
  VoidInvoiceDto,
} from './dto/invoice.dto';
import { InvoicePdfService } from './invoice-pdf.service';
import { InvoicesService } from './invoices.service';

const READ_ROLES = Object.values(RoleName);
const WRITE_ROLES = [RoleName.ADMIN, RoleName.OPERADOR];

@ApiTags('invoices')
@ApiBearerAuth()
@Controller('invoices')
@UseGuards(RolesGuard)
export class InvoicesController {
  constructor(
    private readonly service: InvoicesService,
    private readonly pdf: InvoicePdfService,
  ) {}

  @Get()
  @Roles(...READ_ROLES)
  async all(@Query() query: InvoiceQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { data, total } = await this.service.findAll(
      page,
      limit,
      query.search,
      query.status,
      query.billingPeriodId,
      query.customerId,
    );
    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  @Get('batch/summary')
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'Resume el lote de facturación de un periodo' })
  batchSummary(@Query() query: InvoiceBatchDto) {
    return this.service.batchSummary(query.billingPeriodId);
  }

  @Post('batch/issue')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Emite todas las facturas en borrador de un periodo' })
  issueBatch(
    @Body() dto: InvoiceBatchDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return this.service.issueBatch(dto.billingPeriodId, user.id, request.ip);
  }

  @Get('batch/print')
  @Roles(...READ_ROLES)
  @ApiProduces('application/pdf')
  @ApiOperation({ summary: 'Genera una parte del PDF consolidado del periodo' })
  async printBatch(
    @Query() query: InvoiceBatchDocumentQueryDto,
    @Res() response: Response,
  ): Promise<void> {
    const part = query.part ?? 1;
    const size = query.size ?? 200;
    const result = await this.pdf.generateBatch(query.billingPeriodId, part, size);
    const name = `facturas-periodo-${query.billingPeriodId}-parte-${part}.pdf`;
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Content-Disposition', `inline; filename="${name}"`);
    response.setHeader('Content-Length', String(result.file.length));
    response.setHeader('X-Invoice-Count', String(result.count));
    response.send(result.file);
  }

  @Get('batch/zip')
  @Roles(...READ_ROLES)
  @ApiProduces('application/zip')
  @ApiOperation({ summary: 'Descarga las facturas emitidas como PDF individuales' })
  async downloadBatch(
    @Query() query: InvoiceBatchDto,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.pdf.generateZip(query.billingPeriodId);
    const name = `facturas-periodo-${query.billingPeriodId}.zip`;
    response.setHeader('Content-Type', 'application/zip');
    response.setHeader('Content-Disposition', `attachment; filename="${name}"`);
    response.setHeader('Content-Length', String(result.file.length));
    response.setHeader('X-Invoice-Count', String(result.count));
    response.send(result.file);
  }

  @Get('eligible-readings/:billingPeriodId')
  @Roles(...WRITE_ROLES)
  async eligible(@Param('billingPeriodId') id: number) {
    return { data: await this.service.eligibleReadings(id) };
  }

  @Get(':id/pdf')
  @Roles(...READ_ROLES)
  @ApiProduces('application/pdf')
  @ApiOperation({ summary: 'Descarga la factura en PDF' })
  async downloadPdf(
    @Param('id') id: number,
    @Res() response: Response,
  ): Promise<void> {
    const invoice = await this.service.findOne(id);
    const file = await this.pdf.generate(id);
    const name = `FAC-${String(invoice.sequence).padStart(6, '0')}.pdf`;
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Content-Disposition', `attachment; filename="${name}"`);
    response.setHeader('Content-Length', String(file.length));
    response.send(file);
  }

  @Get(':id')
  @Roles(...READ_ROLES)
  one(@Param('id') id: number) {
    return this.service.findOne(id);
  }

  @Post('generate')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Genera una factura individual en borrador' })
  generate(
    @Body() dto: GenerateInvoiceDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return this.service.generate(dto, user.id, request.ip);
  }

  @Post('generate-batch')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Genera facturas para las lecturas del periodo' })
  batch(
    @Body() dto: GenerateInvoiceBatchDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return this.service.generateBatch(dto, user.id, request.ip);
  }

  @Post(':id/issue')
  @Roles(...WRITE_ROLES)
  issue(
    @Param('id') id: number,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return this.service.issue(id, user.id, request.ip);
  }

  @Post(':id/void')
  @Roles(RoleName.ADMIN)
  void(
    @Param('id') id: number,
    @Body() dto: VoidInvoiceDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return this.service.void(id, dto.reason, user.id, request.ip);
  }
}
