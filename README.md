# AquaERP

Sistema ERP — repositorio en configuración inicial.

## Ramas

| Rama | Uso |
|------|-----|
| `main` | Producción — código estable y desplegado |
| `develop` | Desarrollo — integración de features |

## Flujo de trabajo

1. Crear rama desde `develop`: `git checkout develop && git pull && git checkout -b feature/mi-feature`
2. Desarrollar y hacer commit en la rama feature
3. Abrir PR hacia `develop`
4. Cuando esté listo para producción, merge de `develop` → `main`
