import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InvoiceStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class GenerateInvoiceDto {
  @ApiProperty() @IsUUID() meterReadingId!: string;
  @ApiPropertyOptional({ format: 'date' }) @IsOptional() @IsDateString({ strict: true }) issueDate?: string;
  @ApiPropertyOptional({ format: 'date' }) @IsOptional() @IsDateString({ strict: true }) dueDate?: string;
}
export class GenerateInvoiceBatchDto {
  @ApiProperty() @IsUUID() billingPeriodId!: string;
  @ApiPropertyOptional({ format: 'date' }) @IsOptional() @IsDateString({ strict: true }) issueDate?: string;
  @ApiPropertyOptional({ format: 'date' }) @IsOptional() @IsDateString({ strict: true }) dueDate?: string;
}
export class VoidInvoiceDto {
  @ApiProperty() @IsString() @MinLength(5) @MaxLength(250) reason!: string;
}
export class InvoiceQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: InvoiceStatus }) @IsOptional() @IsEnum(InvoiceStatus) status?: InvoiceStatus;
  @ApiPropertyOptional() @IsOptional() @IsUUID() billingPeriodId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() customerId?: string;
}
