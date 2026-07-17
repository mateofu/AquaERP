import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { EnvConfig } from './config/env.validation';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger:
      process.env.NODE_ENV === 'production'
        ? ['error', 'warn', 'log']
        : ['error', 'warn', 'log', 'debug'],
  });

  const configService = app.get(ConfigService<EnvConfig, true>);
  const apiPrefix = configService.get('API_PREFIX', { infer: true });
  const port = configService.get('PORT', { infer: true });
  const corsOrigin = configService.get('CORS_ORIGIN', { infer: true });
  const swaggerEnabled = configService.get('SWAGGER_ENABLED', { infer: true });
  const swaggerPath = configService.get('SWAGGER_PATH', { infer: true });

  app.use(helmet());
  app.setGlobalPrefix(apiPrefix);
  app.enableCors({
    origin: corsOrigin.split(',').map((origin) => origin.trim()),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());

  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('AquaERP Rural API')
      .setDescription('API administrativa para acueductos veredales')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${apiPrefix}/${swaggerPath}`, app, document);
  }

  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`Application running on http://localhost:${port}/${apiPrefix}`);

  if (swaggerEnabled) {
    logger.log(
      `Swagger available at http://localhost:${port}/${apiPrefix}/${swaggerPath}`,
    );
  }
}

void bootstrap();
