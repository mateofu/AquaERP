import { Module } from '@nestjs/common';
import { BillingPeriodsModule } from '../billing-periods/billing-periods.module';
import { MeterReadingsController } from './meter-readings.controller';
import { MeterReadingsRepository } from './meter-readings.repository';
import { MeterReadingsService } from './meter-readings.service';

@Module({
  imports: [BillingPeriodsModule],
  controllers: [MeterReadingsController],
  providers: [MeterReadingsService, MeterReadingsRepository],
})
export class MeterReadingsModule {}
