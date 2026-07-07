# AquaERP Backend

API REST para AquaERP Rural — NestJS + PostgreSQL + Prisma.

## Requisitos

- Node.js **>= 20.11** (recomendado 22 LTS)
- Docker Desktop
- npm

## Inicio rápido

```bash
# 1. Variables de entorno
cp .env.example .env

# 2. Base de datos
docker compose up -d

# 3. Dependencias
npm install

# 4. Prisma
npm run prisma:generate
npx prisma migrate dev --name init

# 5. Servidor
npm run start:dev
```

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Estado de API y PostgreSQL |
| GET | `/api/docs` | Swagger UI |

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run start:dev` | Desarrollo con hot reload |
| `npm run build` | Build producción |
| `npm run test:e2e` | Tests end-to-end |
| `npm run prisma:studio` | UI de base de datos |

## Estructura

```
src/
├── common/          # Filtros, guards, decorators (Fase 1+)
├── config/          # Validación de env con Zod
├── prisma/          # PrismaService global
└── modules/
    └── health/      # Health check
```

## Fase actual

**Fase 0 — Fundación** completada. Siguiente: Fase 1 (auth, roles, maestros).
