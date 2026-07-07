# AquaERP Rural

Micro-ERP vertical para acueductos veredales. Centraliza suscriptores, predios, medidores, lecturas, tarifas, facturación, pagos, cartera y reportes.

**Objetivo:** reducir un proceso manual de varias semanas a horas o pocos días, con trazabilidad y bajo costo operativo.

---

## Repositorio

```
AquaERP/
├── backend/          # API NestJS + PostgreSQL + Prisma
├── frontend/         # SPA Angular + Angular Material
└── README.md
```

---

## Stack general

| Capa | Tecnologías |
|------|-------------|
| Frontend | Angular 19+, Angular Material, Reactive Forms, Standalone Components, Signals |
| Backend | NestJS 11, Node.js 22 LTS, PostgreSQL 16, Prisma 6 |
| Auth | JWT + Refresh Token, RBAC |
| API | REST + Swagger/OpenAPI 3 |
| Infra | Docker Compose, GitHub Actions, VPS o cloud económico |

---

## Decisión arquitectónica global

**Monolito modular** en backend y frontend. Sin microservicios ni micro-frontends en el MVP.

- Un solo deploy por capa
- Una base de datos PostgreSQL
- Módulos/features con fronteras claras
- Posibilidad de extraer un módulo en el futuro si el producto crece

---

# Backend

## Arquitectura

**Monolito modular con arquitectura hexagonal ligera por módulo.**

```
┌─────────────────────────────────────────────────────────┐
│                    API Layer (NestJS)                    │
│  Controllers + Guards + Pipes + Swagger + Interceptors  │
├─────────────────────────────────────────────────────────┤
│              Application Layer (Use Cases)               │
│  Services / DTOs / Validators / Orquestación           │
├─────────────────────────────────────────────────────────┤
│                  Domain Layer (Core)                     │
│  Entidades, reglas de negocio, eventos de dominio        │
├─────────────────────────────────────────────────────────┤
│              Infrastructure Layer                        │
│  Prisma, PDF, storage, mail                              │
└─────────────────────────────────────────────────────────┘
                          │
                    PostgreSQL
```

### Patrones

- **Modular Monolith** — un módulo NestJS por dominio de negocio
- **Repository Pattern** — Prisma detrás de interfaces por dominio
- **Service Layer** — lógica fuera de controllers
- **DTO Pattern** — entrada/salida tipada con `class-validator`
- **Domain Events internos** — `EventEmitter` de NestJS (sin message brokers)
- **Transacciones** — `$transaction` de Prisma en facturación y pagos

### Lo que no se implementa en el MVP

- Microservicios
- CQRS completo
- GraphQL
- Redis / cache
- RabbitMQ / Kafka

## Estructura de carpetas

```
backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   │
│   ├── common/                 # Cross-cutting
│   │   ├── decorators/         # @Roles(), @CurrentUser()
│   │   ├── filters/
│   │   ├── guards/             # JwtAuthGuard, RolesGuard
│   │   ├── interceptors/
│   │   └── pipes/
│   │
│   ├── config/                 # Env, database, jwt
│   │
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── roles/
│   │   ├── customers/          # Suscriptores
│   │   ├── properties/         # Predios
│   │   ├── meters/             # Medidores
│   │   ├── meter-readings/     # Lecturas
│   │   ├── tariffs/            # Tarifas
│   │   ├── billing-periods/    # Periodos mensuales
│   │   ├── invoices/           # Facturación + PDF
│   │   ├── payments/           # Pagos + recibos
│   │   ├── portfolio/          # Cartera
│   │   ├── reports/
│   │   └── audit/
│   │
│   └── prisma/
│       ├── schema.prisma
│       └── migrations/
│
├── test/
├── docker-compose.yml
├── Dockerfile
└── .env.example
```

Cada módulo sigue la misma forma:

```
modules/invoices/
├── invoices.module.ts
├── invoices.controller.ts
├── invoices.service.ts
├── dto/
├── entities/
└── invoices.repository.ts
```

## Modelo de datos (relaciones clave)

```
users ──< user_roles >── roles

customers ──< properties ──< meters ──< meter_readings
                                              │
billing_periods ──────────────────────────────┘
       │
       └──< invoices ──< invoice_items
                │
                └──< payments ──< payment_receipts

tariffs
audit_logs
```

## Roles (RBAC)

| Rol | Responsabilidad |
|-----|-----------------|
| `ADMIN` | Configuración, usuarios, tarifas, reportes, auditoría |
| `OPERADOR` | Suscriptores, predios, medidores, lecturas, facturación |
| `CAJERO` | Pagos, cartera, recibos |
| `LECTOR` | Registro de lecturas en campo |
| `CONSULTA` | Solo lectura de reportes y datos |

## Fases de desarrollo — Backend

| Fase | Entregables | Resultado |
|------|-------------|-----------|
| **0 — Fundación** | NestJS + Prisma + Docker, Swagger, health check, CI | API ejecutable con DB conectada |
| **1 — Base administrativa** | Auth, JWT, RBAC, CRUD suscriptores/predios/medidores, audit | Datos maestros listos |
| **2 — Lecturas y consumos** | Periodos, lecturas, validaciones, consumo automático | Lecturas sin cálculos manuales |
| **3 — Facturación** | Tarifas, generación masiva/individual, PDF, estados | Facturación mensual funcional |
| **4 — Pagos y cartera** | Pagos totales/parciales, recibos, morosos, reportes | Ciclo mensual completo |
| **5 — Optimización** | Excel, email/WhatsApp, fotos contador, dashboard, backups | Producto usable en campo |

### Ciclo mensual (flujo backend)

1. Abrir periodo de facturación
2. Cargar lecturas (individual o masiva)
3. Calcular consumos y validar anomalías
4. Generar facturas masivas + PDF
5. Registrar pagos (total o parcial)
6. Consultar cartera y morosos

---

# Frontend

## Arquitectura

**Feature-Based + Clean Architecture adaptada por capas dentro de cada feature.**

El backend es la fuente de verdad del negocio. El frontend organiza la experiencia operativa sin duplicar reglas críticas (facturación, cartera, permisos finales).

```
                    ┌─────────────────┐
                    │  PRESENTATION   │  Componentes, templates, rutas
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  APPLICATION    │  Facades, stores, orquestación UI
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │     DOMAIN      │  Modelos, enums, reglas UI, validadores
                    └────────▲────────┘
                             │
                    ┌────────┴────────┐
                    │ INFRASTRUCTURE  │  HTTP, mappers, storage, interceptors
                    └─────────────────┘
```

### Regla de dependencias

- `Presentation` → `Application` → `Domain`
- `Infrastructure` → `Application` (implementa acceso a API)
- `Domain` **no depende** de Angular, HttpClient ni Material

### Qué va en cada capa

| Capa | Contenido | No incluye |
|------|-----------|------------|
| **Domain** | Interfaces, enums, validadores puros, reglas de formulario | Lógica de facturación del backend |
| **Application** | Facades, stores (Signals), flujos de pantalla | Templates HTML, HTTP directo |
| **Presentation** | Pages, dumb/smart components, Material | Lógica de negocio, llamadas API |
| **Infrastructure** | API clients, mappers DTO→model, interceptors | Componentes visuales |

### Patrones

- **Smart vs Dumb components** — pages orquestan, components reciben `@Input`/`@Output`
- **Facades por feature** — un punto de entrada por módulo funcional
- **Services + Signals** — estado local (sin NgRx en MVP)
- **Lazy loading** — una ruta lazy por feature
- **RBAC en rutas y UI** — guards + directiva `*appHasRole` (el backend enforce permisos)

## Estructura de carpetas

```
frontend/
├── src/
│   ├── app/
│   │   ├── app.component.ts
│   │   ├── app.config.ts
│   │   ├── app.routes.ts
│   │   │
│   │   ├── core/                    # Singleton global
│   │   │   ├── auth/
│   │   │   ├── interceptors/
│   │   │   ├── services/
│   │   │   └── models/
│   │   │
│   │   ├── shared/                  # UI reutilizable
│   │   │   ├── components/
│   │   │   ├── pipes/
│   │   │   ├── directives/
│   │   │   └── validators/
│   │   │
│   │   ├── layout/
│   │   │   ├── main-layout/
│   │   │   ├── auth-layout/
│   │   │   ├── sidebar/
│   │   │   └── navbar/
│   │   │
│   │   └── features/
│   │       ├── auth/
│   │       ├── dashboard/
│   │       ├── customers/
│   │       ├── properties/
│   │       ├── meters/
│   │       ├── readings/
│   │       ├── tariffs/
│   │       ├── billing/
│   │       ├── payments/
│   │       ├── portfolio/
│   │       ├── reports/
│   │       └── admin/
│   │
│   ├── environments/
│   └── styles/
│
├── angular.json
└── package.json
```

### Estructura interna por feature (features complejos)

Usar las 4 capas en módulos con lógica relevante: `readings`, `billing`, `payments`, `portfolio`.

```
features/billing/
├── domain/
│   ├── models/
│   ├── rules/
│   └── validators/
├── application/
│   ├── billing.facade.ts
│   └── billing.store.ts
├── infrastructure/
│   ├── billing.api.ts
│   └── billing.mapper.ts
└── presentation/
    ├── pages/
    └── components/
```

Features CRUD simples (`customers`, `meters`) pueden usar solo `application/` + `presentation/` con domain mínimo.

## Fases de desarrollo — Frontend

| Fase | Entregables UI | Alineación backend |
|------|----------------|-------------------|
| **0 — Fundación** | Scaffold Angular, layout, sidebar, routing lazy, login shell | Fase 0 |
| **1 — Base administrativa** | Login JWT, CRUD suscriptores/predios/medidores, tablas y formularios | Fase 1 |
| **2 — Lecturas** | Carga mensual, validaciones, alertas de consumo anormal | Fase 2 |
| **3 — Facturación** | Generación masiva, detalle factura, descarga PDF | Fase 3 |
| **4 — Pagos y cartera** | Registro de pagos, recibos, morosos, reportes básicos | Fase 4 |
| **5 — Optimización** | PWA, fotos de contador, export Excel, dashboard | Fase 5 |

---

## MVP — Alcance funcional

El MVP debe cubrir el flujo mínimo completo:

- Login, JWT y control de roles
- Gestión de suscriptores, predios y medidores
- Registro mensual de lecturas y cálculo de consumo
- Configuración básica de tarifas
- Generación individual y masiva de facturas
- Factura PDF descargable
- Pagos totales o parciales
- Reporte básico de cartera y usuarios morosos

---

## Desarrollo local

```bash
# Backend
cd backend
docker compose up -d
npm install
npx prisma migrate dev
npm run start:dev
# → http://localhost:3000/api/docs

# Frontend
cd frontend
npm install
npm start
# → http://localhost:4200
```

---

## Convenciones

- **Idioma UI:** español
- **Moneda:** COP
- **Tipos API:** generar desde OpenAPI/Swagger del backend (`openapi-typescript`)
- **Commits:** convencionales (`feat:`, `fix:`, `docs:`, etc.)
- **Ramas:** `main` estable, `develop` integración, features por módulo

---

## Resultado esperado del MVP

Al finalizar, el acueducto podrá ejecutar su ciclo mensual completo: registrar lecturas, calcular consumos, generar facturas, registrar pagos y consultar cartera. Estable, fácil de usar y modular para crecer hacia PWA, reportes avanzados y envío de facturas.
