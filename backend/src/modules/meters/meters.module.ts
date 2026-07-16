import { Module } from '@nestjs/common';
import { PropertiesModule } from '../properties/properties.module';
import { MetersController } from './meters.controller';
import { MetersRepository } from './meters.repository';
import { MetersService } from './meters.service';

@Module({
  imports: [PropertiesModule],
  controllers: [MetersController],
  providers: [MetersService, MetersRepository],
})
export class MetersModule {}
