import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { TariffStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class CreateTariffDto {
  @ApiProperty() @IsString() @MinLength(3) @MaxLength(120) name!: string;
  @ApiProperty({ minimum: 0 }) @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) fixedCharge!: number;
  @ApiProperty({ minimum: 0 }) @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) pricePerCubicMeter!: number;
  @ApiProperty({ format: 'date' }) @IsDateString({ strict: true }) validFrom!: string;
  @ApiPropertyOptional({ format: 'date' }) @IsOptional() @IsDateString({ strict: true }) validTo?: string;
}
export class UpdateTariffDto extends PartialType(CreateTariffDto) {}
export class TariffQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: TariffStatus }) @IsOptional() @IsEnum(TariffStatus) status?: TariffStatus;
}
