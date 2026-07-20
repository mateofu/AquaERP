import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class CreateMeterReadingDto {
  @ApiProperty()
  @IsUUID()
  meterId!: string;

  @ApiProperty()
  @IsUUID()
  billingPeriodId!: string;

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
  @IsUUID()
  billingPeriodId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  meterId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  hasAnomaly?: boolean;
}
