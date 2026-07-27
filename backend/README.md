# AquaERP Backend

API REST para AquaERP Rural — NestJS + PostgreSQL + Prisma.

## Requisitos

- Node.js **>= 20.11** (recomendado 22 LTS)
- Docker Desktop
- npm

## Inicio rápido

```bash
# 1. Variables de entorno (reemplaza todos los valores `replace-with-*`)
cp .env.example .env

# 2. Base de datos
docker compose up -d

# 3. Dependencias
npm install

# 4. Prisma
npm run prisma:generate
npx prisma migrate deploy
npm run prisma:seed

# 5. Servidor
npm run start:dev
```

## Variables y secretos

- `.env` es solo para desarrollo local y está excluido de Git.
- En producción, configura los secretos en el servidor, Docker o la plataforma
  de despliegue; no copies el `.env` al repositorio ni a la imagen.
- Genera valores únicos para `JWT_ACCESS_SECRET`, `POSTGRES_PASSWORD`,
  `DATABASE_URL` y `SEED_ADMIN_PASSWORD`.
- `SEED_ADMIN_PASSWORD` debe tener al menos 12 caracteres en producción.
- `CORS_ORIGIN` debe contener únicamente los dominios HTTPS autorizados,
  separados por comas.
- El backend no inicia en producción si detecta secretos de ejemplo,
  contraseñas predeterminadas, CORS abierto o direcciones locales.

Ejemplo para generar un secreto JWT:

```bash
openssl rand -base64 48
```

Las credenciales iniciales del administrador se toman de
`SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD`; no tienen valores seguros por
defecto para producción.

## Endpoints

| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| GET | `/api/health` | Estado de API y PostgreSQL | Público |
| POST | `/api/auth/login` | Iniciar sesión | Público |
| POST | `/api/auth/refresh` | Renovar access token | Público |
| POST | `/api/auth/logout` | Cerrar sesión | Autenticado |
| GET | `/api/users` | Lista usuarios | ADMIN |
| GET | `/api/roles` | Lista roles | ADMIN |
| GET/POST/PATCH/DELETE | `/api/customers` | CRUD suscriptores | Ver Swagger |
| GET/POST/PATCH/DELETE | `/api/properties` | CRUD predios | Ver Swagger |
| GET/POST/PATCH/DELETE | `/api/meters` | CRUD medidores | Ver Swagger |
| GET | `/api/audit` | Registros de auditoría | ADMIN |
| GET | `/api/docs` | Swagger UI | Público |

Documentación completa en Swagger: `http://localhost:3000/api/docs`

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run start:dev` | Desarrollo con hot reload |
| `npm run build` | Build producción |
| `npm run lint` | Verificación estática sin modificar archivos |
| `npm run lint:fix` | Corrige automáticamente problemas de formato/lint |
| `npm test` | Pruebas unitarias |
| `npm run test:e2e` | Tests end-to-end |
| `npm run prisma:seed` | Datos iniciales (roles + admin) |
| `npm run prisma:studio` | UI de base de datos |

## Estructura

```
src/
├── common/          # Decorators, guards, DTOs compartidos
├── config/          # Validación de env con Zod
├── prisma/          # PrismaService global
└── modules/
    ├── auth/        # JWT + refresh token
    ├── users/       # Gestión de usuarios
    ├── roles/       # Catálogo de roles
    ├── customers/   # Suscriptores
    ├── properties/  # Predios
    ├── meters/      # Medidores
    ├── audit/       # Auditoría
    └── health/      # Health check
```

## Fase actual

**Fase 1.5 — Estabilización del backend** en curso. Incluye contratos de error
uniformes, seguridad HTTP, rate limiting, rotación de refresh tokens,
auditoría transaccional, lint y ampliación de pruebas. Siguiente: frontend
administrativo y Fase 2 (lecturas y consumos).
