import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InvoiceStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class GenerateInvoiceDto {
  @ApiProperty() @Type(() => Number) @IsInt() @Min(1) meterReadingId!: number;
  @ApiPropertyOptional({ format: 'date' }) @IsOptional() @IsDateString({ strict: true }) issueDate?: string;
  @ApiPropertyOptional({ format: 'date' }) @IsOptional() @IsDateString({ strict: true }) dueDate?: string;
}
export class GenerateInvoiceBatchDto {
  @ApiProperty() @Type(() => Number) @IsInt() @Min(1) billingPeriodId!: number;
  @ApiPropertyOptional({ format: 'date' }) @IsOptional() @IsDateString({ strict: true }) issueDate?: string;
  @ApiPropertyOptional({ format: 'date' }) @IsOptional() @IsDateString({ strict: true }) dueDate?: string;
}
export class VoidInvoiceDto {
  @ApiProperty() @IsString() @MinLength(5) @MaxLength(250) reason!: string;
}
export class InvoiceQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: InvoiceStatus }) @IsOptional() @IsEnum(InvoiceStatus) status?: InvoiceStatus;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) billingPeriodId?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) customerId?: number;
}

export class InvoiceBatchDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  billingPeriodId!: number;
}

export class InvoiceBatchDocumentQueryDto extends InvoiceBatchDto {
  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  part?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 200, default: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  size?: number;
}
