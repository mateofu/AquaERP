import { Module } from '@nestjs/common';
import { BillingPeriodsController } from './billing-periods.controller';
import { BillingPeriodsRepository } from './billing-periods.repository';
import { BillingPeriodsService } from './billing-periods.service';

@Module({
  controllers: [BillingPeriodsController],
  providers: [BillingPeriodsService, BillingPeriodsRepository],
  exports: [BillingPeriodsRepository],
})
export class BillingPeriodsModule {}
