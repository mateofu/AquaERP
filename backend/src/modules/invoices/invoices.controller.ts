import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common'; import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'; import { RoleName } from '@prisma/client'; import { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator'; import { Roles } from '../../common/decorators/roles.decorator'; import { buildPaginationMeta } from '../../common/dto/pagination-query.dto'; import { RolesGuard } from '../../common/guards/roles.guard'; import { AuthUser } from '../../common/types/auth-user.type';
import { GenerateInvoiceBatchDto, GenerateInvoiceDto, InvoiceQueryDto, VoidInvoiceDto } from './dto/invoice.dto'; import { InvoicesService } from './invoices.service';
const WRITE=[RoleName.ADMIN,RoleName.OPERADOR];
@ApiTags('invoices') @ApiBearerAuth() @Controller('invoices') @UseGuards(RolesGuard)
export class InvoicesController {constructor(private readonly service:InvoicesService){}
  @Get() @Roles(...Object.values(RoleName)) async all(@Query() q:InvoiceQueryDto){const page=q.page??1,limit=q.limit??20;const {data,total}=await this.service.findAll(page,limit,q.search,q.status,q.billingPeriodId,q.customerId);return{data,meta:buildPaginationMeta(total,page,limit)}}
  @Get('eligible-readings/:billingPeriodId') @Roles(...WRITE) async eligible(@Param('billingPeriodId') id:number){return{data:await this.service.eligibleReadings(id)}}
  @Get(':id') @Roles(...Object.values(RoleName)) one(@Param('id') id:number){return this.service.findOne(id)}
  @Post('generate') @Roles(...WRITE) @ApiOperation({summary:'Genera una factura individual en borrador'}) generate(@Body() d:GenerateInvoiceDto,@CurrentUser() u:AuthUser,@Req() r:Request){return this.service.generate(d,u.id,r.ip)}
  @Post('generate-batch') @Roles(...WRITE) @ApiOperation({summary:'Genera facturas para todas las lecturas del periodo'}) batch(@Body() d:GenerateInvoiceBatchDto,@CurrentUser() u:AuthUser,@Req() r:Request){return this.service.generateBatch(d,u.id,r.ip)}
  @Post(':id/issue') @Roles(...WRITE) issue(@Param('id') id:number,@CurrentUser() u:AuthUser,@Req() r:Request){return this.service.issue(id,u.id,r.ip)}
  @Post(':id/void') @Roles(RoleName.ADMIN) void(@Param('id') id:number,@Body() d:VoidInvoiceDto,@CurrentUser() u:AuthUser,@Req() r:Request){return this.service.void(id,d.reason,u.id,r.ip)}
}
