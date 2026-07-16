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
});
