process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://aquaerp:aquaerp@localhost:5432/aquaerp?schema=public';
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ??
  'test-secret-with-at-least-32-characters-long';
process.env.JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN ?? '15m';
process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d';
process.env.API_PREFIX = process.env.API_PREFIX ?? 'api';
process.env.SWAGGER_ENABLED = process.env.SWAGGER_ENABLED ?? 'false';
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:4200';
process.env.SEED_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@aquaerp.local';
process.env.SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!';
