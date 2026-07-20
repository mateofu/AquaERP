import { ApiPropertyOptional } from '@nestjs/swagger';
import { BillingPeriodStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CatalogQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 50;
}

export class BillingPeriodCatalogQueryDto extends CatalogQueryDto {
  @ApiPropertyOptional({ enum: BillingPeriodStatus })
  @IsOptional()
  @IsEnum(BillingPeriodStatus)
  status?: BillingPeriodStatus;
}
