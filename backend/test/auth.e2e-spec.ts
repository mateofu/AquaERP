import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/http-exception.filter';
import { seedDatabase } from './helpers/seed-database';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    seedDatabase();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('/api/auth/login (POST) — credenciales válidas', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'admin@aquaerp.local',
        password: 'Admin123!',
      })
      .expect(201);

    expect(response.body).toMatchObject({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
      user: {
        email: 'admin@aquaerp.local',
        roles: expect.arrayContaining(['ADMIN']),
      },
    });
  });

  it('/api/customers (GET) — requiere autenticación', () => {
    return request(app.getHttpServer()).get('/api/customers').expect(401);
  });

  it('/api/customers (GET) — con token válido', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'admin@aquaerp.local',
        password: 'Admin123!',
      });

    return request(app.getHttpServer())
      .get('/api/customers')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          data: expect.any(Array),
          meta: {
            total: expect.any(Number),
            page: 1,
            limit: 20,
          },
        });
      });
  });

  it('/api/auth/refresh (POST) — rota el refresh token', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'admin@aquaerp.local',
        password: 'Admin123!',
      })
      .expect(201);

    const originalRefreshToken = login.body.refreshToken as string;
    const rotated = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken: originalRefreshToken })
      .expect(201);

    expect(rotated.body).toMatchObject({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
    });
    expect(rotated.body.refreshToken).not.toBe(originalRefreshToken);

    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken: originalRefreshToken })
      .expect(401);

    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken: rotated.body.refreshToken })
      .expect(201);
  });

  it('/api/properties (GET) — rechaza paginación inválida', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'admin@aquaerp.local',
        password: 'Admin123!',
      });

    return request(app.getHttpServer())
      .get('/api/properties?page=0&limit=101')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .expect(400)
      .expect((response) => {
        expect(response.body).toMatchObject({
          statusCode: 400,
          code: 'VALIDATION_ERROR',
          message: 'Los datos enviados no son válidos',
          errors: expect.any(Array),
        });
      });
  });
});
