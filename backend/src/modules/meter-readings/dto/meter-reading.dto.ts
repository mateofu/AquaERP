import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class CreateMeterReadingDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  meterId!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  billingPeriodId!: number;

  @ApiProperty({ example: 1250.5, minimum: 0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  readingValue!: number;

  @ApiProperty({ example: '2026-07-20' })
  @IsDateString()
  readingDate!: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class UpdateMeterReadingDto extends PartialType(
  CreateMeterReadingDto,
) {}

export class MeterReadingQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  billingPeriodId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  meterId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  hasAnomaly?: boolean;
}
