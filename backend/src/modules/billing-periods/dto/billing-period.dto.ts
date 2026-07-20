import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { BillingPeriodStatus } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class CreateBillingPeriodDto {
  @ApiProperty({ example: 2026, minimum: 2000, maximum: 2100 })
  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;

  @ApiProperty({ example: 7, minimum: 1, maximum: 12 })
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;
}

export class UpdateBillingPeriodDto extends PartialType(
  CreateBillingPeriodDto,
) {}

export class BillingPeriodQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: BillingPeriodStatus })
  @IsOptional()
  @IsEnum(BillingPeriodStatus)
  status?: BillingPeriodStatus;

  @ApiPropertyOptional({ minimum: 2000, maximum: 2100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;
}
