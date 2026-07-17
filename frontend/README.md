# AquaERP Frontend

SPA administrativa de AquaERP Rural construida con Angular 20 LTS, Angular
Material, componentes standalone, Signals y formularios reactivos.

## Requisitos

- Node.js 22 LTS
- npm
- Backend disponible en `http://localhost:3000/api`

## Desarrollo

```bash
npm install
npm start
```

La aplicación estará disponible en `http://localhost:4200`.

## Verificaciones

```bash
npm run lint
npm test
npm run build
```

## Arquitectura

- `core/`: configuración, errores y servicios globales independientes del negocio.
- `layout/`: estructura visual y navegación global.
- `features/`: funcionalidades cargadas de forma lazy.
- `shared/`: componentes, páginas y utilidades reutilizables.
- `environments/`: configuración por entorno.

La lógica de negocio permanece en el backend. El frontend administra estado de
interfaz, formularios, navegación y consumo tipado de la API.

Las features con lógica relevante siguen esta dependencia:

```text
presentation -> application -> domain
infrastructure -> application/domain
```

`application` define puertos y casos de uso; `infrastructure` implementa esos
puertos. `domain` no importa Angular, HTTP, Material ni almacenamiento web.

Los componentes reutilizables viven en `shared/` cuando son independientes de
una feature. Los componentes propios de un flujo permanecen en
`features/<feature>/presentation/components`.
