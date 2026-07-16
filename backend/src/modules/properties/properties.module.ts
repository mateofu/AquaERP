import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { PropertiesController } from './properties.controller';
import { PropertiesRepository } from './properties.repository';
import { PropertiesService } from './properties.service';

@Module({
  imports: [CustomersModule],
  controllers: [PropertiesController],
  providers: [PropertiesService, PropertiesRepository],
  exports: [PropertiesRepository],
})
export class PropertiesModule {}
