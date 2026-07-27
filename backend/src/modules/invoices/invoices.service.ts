import { ConflictException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { AuditAction, AuditEntity, BillingPeriodStatus, InvoiceItemType, InvoiceStatus, Prisma, TariffStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service'; import { AuditService } from '../audit/audit.service';
import { GenerateInvoiceBatchDto, GenerateInvoiceDto } from './dto/invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}
  async findAll(page:number,limit:number,search?:string,status?:InvoiceStatus,billingPeriodId?:number,customerId?:number){
    const where:Prisma.InvoiceWhereInput={status,billingPeriodId,customerId,OR:search?.trim()?[{customerName:{contains:search.trim(),mode:'insensitive'}},{customerDocument:{contains:search.trim()}},{meterSerial:{contains:search.trim(),mode:'insensitive'}}]:undefined};
    const [data,total]=await Promise.all([this.prisma.invoice.findMany({where,skip:(page-1)*limit,take:limit,include:{items:true,billingPeriod:true},orderBy:{sequence:'desc'}}),this.prisma.invoice.count({where})]); return {data,total};
  }
  async findOne(id:number){const value=await this.prisma.invoice.findUnique({where:{id},include:{items:true,billingPeriod:true,tariff:true}});if(!value)throw new NotFoundException('Factura no encontrada');return value;}
  async batchSummary(billingPeriodId:number){
    const period=await this.prisma.billingPeriod.findUnique({where:{id:billingPeriodId}});
    if(!period)throw new NotFoundException('Periodo no encontrado');
    const where:Prisma.InvoiceWhereInput={billingPeriodId};
    const [aggregate,statuses,sample]=await Promise.all([
      this.prisma.invoice.aggregate({where,_count:{_all:true},_sum:{total:true,consumption:true}}),
      this.prisma.invoice.groupBy({by:['status'],where,_count:{_all:true}}),
      this.prisma.invoice.findMany({where,orderBy:{sequence:'asc'},take:10,select:{id:true,sequence:true,customerName:true,customerDocument:true,propertyCode:true,meterSerial:true,total:true,status:true}}),
    ]);
    const statusMap=Object.fromEntries(statuses.map(value=>[value.status,value._count._all])) as Partial<Record<InvoiceStatus,number>>;
    const deliverableCount=(statusMap.ISSUED??0)+(statusMap.PAID??0)+(statusMap.OVERDUE??0);
    return{
      billingPeriod:{id:period.id,year:period.year,month:period.month,status:period.status},
      total:aggregate._count._all,
      totalAmount:aggregate._sum.total??new Prisma.Decimal(0),
      totalConsumption:aggregate._sum.consumption??new Prisma.Decimal(0),
      statuses:statusMap,
      sample,
      printPartSize:200,
      printParts:Math.ceil(deliverableCount/200),
    };
  }
  async findBatchDocuments(billingPeriodId:number,skip=0,take?:number,deliverable=false){
    return this.prisma.invoice.findMany({
      where:{billingPeriodId,status:deliverable?{in:[InvoiceStatus.ISSUED,InvoiceStatus.PAID,InvoiceStatus.OVERDUE]}:undefined},
      skip,
      take,
      include:{items:true,billingPeriod:true,tariff:true},
      orderBy:{sequence:'asc'},
    });
  }
  async issueBatch(billingPeriodId:number,userId:number,ipAddress?:string){
    const drafts=await this.prisma.invoice.findMany({where:{billingPeriodId,status:InvoiceStatus.DRAFT},select:{id:true}});
    if(!drafts.length)throw new UnprocessableEntityException('No hay facturas en borrador para emitir en este periodo');
    const issuedAt=new Date();
    await this.prisma.$transaction(async tx=>{
      await tx.invoice.updateMany({where:{id:{in:drafts.map(value=>value.id)},status:InvoiceStatus.DRAFT},data:{status:InvoiceStatus.ISSUED,issuedAt}});
      await tx.auditLog.createMany({data:drafts.map(value=>({userId,action:AuditAction.UPDATE,entity:AuditEntity.INVOICE,entityId:value.id,changes:{beforeStatus:InvoiceStatus.DRAFT,afterStatus:InvoiceStatus.ISSUED,billingPeriodId},ipAddress}))});
    });
    return{billingPeriodId,issuedCount:drafts.length,issuedAt};
  }
  async eligibleReadings(billingPeriodId:number){const period=await this.prisma.billingPeriod.findUnique({where:{id:billingPeriodId}});if(!period)throw new NotFoundException('Periodo no encontrado');return this.prisma.meterReading.findMany({where:{billingPeriodId,invoice:null},orderBy:{meter:{serialNumber:'asc'}},select:{id:true,consumption:true,meter:{select:{serialNumber:true,property:{select:{code:true,address:true,customer:{select:{firstName:true,lastName:true}}}}}}}})}
  generate(dto:GenerateInvoiceDto,userId:number,ipAddress?:string){return this.createFromReading(dto.meterReadingId,dto.issueDate,dto.dueDate,userId,ipAddress);}
  async generateBatch(dto:GenerateInvoiceBatchDto,userId:number,ipAddress?:string){
    const period=await this.prisma.billingPeriod.findUnique({where:{id:dto.billingPeriodId}}); if(!period)throw new NotFoundException('Periodo no encontrado'); if(period.status!==BillingPeriodStatus.CLOSED)throw new UnprocessableEntityException('Solo se puede facturar un periodo cerrado');
    const readings=await this.prisma.meterReading.findMany({where:{billingPeriodId:dto.billingPeriodId},select:{id:true}}); const generated:number[]=[]; const errors:{meterReadingId:number;message:string}[]=[];
    for(const reading of readings){try{const invoice=await this.createFromReading(reading.id,dto.issueDate,dto.dueDate,userId,ipAddress);generated.push(invoice.id)}catch(error){errors.push({meterReadingId:reading.id,message:error instanceof Error?error.message:'Error desconocido'})}}
    return {total:readings.length,generatedCount:generated.length,errorCount:errors.length,invoiceIds:generated,errors};
  }
  async issue(id:number,userId:number,ipAddress?:string){const current=await this.findOne(id);if(current.status!==InvoiceStatus.DRAFT)throw new UnprocessableEntityException('Solo se puede emitir una factura en borrador');return this.change(id,{status:InvoiceStatus.ISSUED,issuedAt:new Date()},current,userId,ipAddress)}
  async void(id:number,reason:string,userId:number,ipAddress?:string){const current=await this.findOne(id);if(current.status===InvoiceStatus.PAID||current.status===InvoiceStatus.VOID)throw new UnprocessableEntityException('La factura no se puede anular en su estado actual');return this.change(id,{status:InvoiceStatus.VOID,voidedAt:new Date(),voidReason:reason.trim()},current,userId,ipAddress)}
  private async createFromReading(readingId:number,issue?:string,due?:string,userId?:number,ipAddress?:string){
    try{return await this.prisma.$transaction(async tx=>{const reading=await tx.meterReading.findUnique({where:{id:readingId},include:{billingPeriod:true,meter:{include:{property:{include:{customer:true}}}}}});if(!reading)throw new NotFoundException('Lectura no encontrada');if(reading.billingPeriod.status!==BillingPeriodStatus.CLOSED)throw new UnprocessableEntityException('Solo se puede facturar una lectura de un periodo cerrado');
      const periodDate=new Date(Date.UTC(reading.billingPeriod.year,reading.billingPeriod.month-1,1));const tariff=await tx.tariff.findFirst({where:{status:TariffStatus.ACTIVE,validFrom:{lte:periodDate},OR:[{validTo:null},{validTo:{gte:periodDate}}]},orderBy:{validFrom:'desc'}});if(!tariff)throw new UnprocessableEntityException('No existe una tarifa activa para el periodo');
      const issueDate=this.date(issue??new Date().toISOString().slice(0,10));const dueDate=due?this.date(due):new Date(issueDate.getTime()+15*86400000);if(dueDate<issueDate)throw new UnprocessableEntityException('La fecha de vencimiento debe ser posterior a la emisión');
      const consumptionAmount=reading.consumption.mul(tariff.pricePerCubicMeter).toDecimalPlaces(2);const total=tariff.fixedCharge.add(consumptionAmount).toDecimalPlaces(2);const customer=reading.meter.property.customer;
      const invoice=await tx.invoice.create({data:{billingPeriodId:reading.billingPeriodId,meterReadingId:reading.id,meterId:reading.meterId,customerId:customer.id,tariffId:tariff.id,issueDate,dueDate,customerName:`${customer.firstName} ${customer.lastName}`,customerDocument:customer.documentNumber,propertyCode:reading.meter.property.code,propertyAddress:reading.meter.property.address,meterSerial:reading.meter.serialNumber,previousReading:reading.previousValue,currentReading:reading.readingValue,consumption:reading.consumption,subtotal:total,total,items:{create:[{type:InvoiceItemType.FIXED_CHARGE,description:'Cargo fijo',quantity:new Prisma.Decimal(1),unitPrice:tariff.fixedCharge,amount:tariff.fixedCharge},{type:InvoiceItemType.CONSUMPTION,description:'Consumo de agua',quantity:reading.consumption,unitPrice:tariff.pricePerCubicMeter,amount:consumptionAmount}]}} ,include:{items:true}});
      if(userId)await this.audit.log({userId,action:AuditAction.CREATE,entity:AuditEntity.INVOICE,entityId:invoice.id,changes:{meterReadingId:reading.id,tariffId:tariff.id,total},ipAddress},tx);return invoice;});}catch(error){if(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==='P2002')throw new ConflictException('La lectura ya tiene una factura generada');throw error;}}
  private date(value:string){return new Date(`${value}T00:00:00.000Z`)}
  private change(id:number,data:Prisma.InvoiceUpdateInput,before:object,userId:number,ipAddress?:string){return this.prisma.$transaction(async tx=>{const value=await tx.invoice.update({where:{id},data,include:{items:true}});await this.audit.log({userId,action:AuditAction.UPDATE,entity:AuditEntity.INVOICE,entityId:id,changes:{before,after:value},ipAddress},tx);return value})}
}
