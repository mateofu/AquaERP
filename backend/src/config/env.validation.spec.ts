import { validateEnv } from './env.validation';

const productionEnv = {
  NODE_ENV: 'production',
  DATABASE_URL:
    'postgresql://aquaerp:A-strong-db-password-2026@database:5432/aquaerp',
  JWT_ACCESS_SECRET: 'a-unique-production-jwt-secret-with-40-characters',
  CORS_ORIGIN: 'https://erp.example.org',
  SWAGGER_ENABLED: 'false',
};

describe('validateEnv production security', () => {
  it('accepts explicit production secrets and origin', () => {
    expect(() => validateEnv(productionEnv)).not.toThrow();
  });

  it.each([
    'change-me-use-at-least-32-characters-long',
    'replace-with-a-random-secret-of-at-least-32-characters',
    'example-secret-that-is-long-enough-for-validation',
  ])('rejects an unsafe JWT secret: %s', (JWT_ACCESS_SECRET) => {
    expect(() =>
      validateEnv({ ...productionEnv, JWT_ACCESS_SECRET }),
    ).toThrow('JWT_ACCESS_SECRET');
  });

  it('rejects a default database password', () => {
    expect(() =>
      validateEnv({
        ...productionEnv,
        DATABASE_URL:
          'postgresql://aquaerp:aquaerp@database:5432/aquaerp',
      }),
    ).toThrow('DATABASE_URL');
  });

  it.each([
    'http://localhost:4200',
    'http://127.0.0.1:4200',
    'http://erp.example.org',
    '*',
  ])(
    'rejects an unsafe production CORS origin: %s',
    (CORS_ORIGIN) => {
      expect(() =>
        validateEnv({ ...productionEnv, CORS_ORIGIN }),
      ).toThrow('CORS_ORIGIN');
    },
  );

  it('keeps development defaults compatible', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'development',
        DATABASE_URL:
          'postgresql://aquaerp:aquaerp@localhost:5432/aquaerp',
        JWT_ACCESS_SECRET: 'change-me-use-at-least-32-characters-long',
      }),
    ).not.toThrow();
  });
});
