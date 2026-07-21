import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { AppConfigModule } from './config/config.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { BillingPeriodsModule } from './modules/billing-periods/billing-periods.module';
import { CatalogsModule } from './modules/catalogs/catalogs.module';
import { CustomersModule } from './modules/customers/customers.module';
import { HealthModule } from './modules/health/health.module';
import { MeterReadingsModule } from './modules/meter-readings/meter-readings.module';
import { MetersModule } from './modules/meters/meters.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { RolesModule } from './modules/roles/roles.module';
import { TariffsModule } from './modules/tariffs/tariffs.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    AppConfigModule,
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: configService.get<number>('RATE_LIMIT_TTL_MS', 60000),
            limit: configService.get<number>('RATE_LIMIT_MAX', 100),
          },
        ],
      }),
    }),
    PrismaModule,
    AuditModule,
    AuthModule,
    BillingPeriodsModule,
    CatalogsModule,
    MeterReadingsModule,
    UsersModule,
    RolesModule,
    CustomersModule,
    PropertiesModule,
    MetersModule,
    TariffsModule,
    InvoicesModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
