import { z } from 'zod';

const unsafeSecretPatterns = [
  /change[-_ ]?me/i,
  /replace[-_ ]?with/i,
  /example/i,
  /admin123/i,
  /^aquaerp$/i,
  /^password$/i,
  /^secret$/i,
];

function isUnsafeSecret(value: string): boolean {
  return unsafeSecretPatterns.some((pattern) => pattern.test(value));
}

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  API_PREFIX: z.string().min(1).default('api'),
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().min(2).default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().min(2).default('7d'),
  SWAGGER_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
  SWAGGER_PATH: z.string().min(1).default('docs'),
  CORS_ORIGIN: z.string().min(1).default('http://localhost:4200'),
  RATE_LIMIT_TTL_MS: z.coerce.number().int().positive().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  SEED_ADMIN_EMAIL: z.string().email().optional(),
  SEED_ADMIN_PASSWORD: z.string().min(8).optional(),
}).superRefine((config, context) => {
  if (config.NODE_ENV !== 'production') {
    return;
  }

  if (isUnsafeSecret(config.JWT_ACCESS_SECRET)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['JWT_ACCESS_SECRET'],
      message: 'must be a unique production secret, not an example value',
    });
  }

  const databaseUrl = new URL(config.DATABASE_URL);
  const databasePassword = decodeURIComponent(databaseUrl.password);
  if (
    databasePassword.length < 12 ||
    isUnsafeSecret(databasePassword)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['DATABASE_URL'],
      message: 'must include a strong, non-default database password',
    });
  }

  if (
    config.SEED_ADMIN_PASSWORD &&
    (config.SEED_ADMIN_PASSWORD.length < 12 ||
      isUnsafeSecret(config.SEED_ADMIN_PASSWORD))
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['SEED_ADMIN_PASSWORD'],
      message: 'must contain at least 12 characters and not be a default value',
    });
  }

  const allowedOrigins = config.CORS_ORIGIN.split(',').map((origin) =>
    origin.trim().toLowerCase(),
  );
  if (
    allowedOrigins.some(
      (origin) =>
        !origin.startsWith('https://') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        origin === '*',
    )
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['CORS_ORIGIN'],
      message: 'must contain only explicit production origins',
    });
  }
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }

  return result.data;
}
