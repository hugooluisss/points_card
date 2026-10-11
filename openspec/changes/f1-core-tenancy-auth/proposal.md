# Proposal

## Why

Todas las fases siguientes necesitan un sistema multi-tenant con autenticación, roles y aislamiento por comercio. El aislamiento de datos entre comercios es un requisito legal y de confianza; es más barato construirlo desde el primer endpoint que añadirlo después. F1 también crea el monorepo y el armazón visual del panel, para que las demás fases solo agreguen pantallas.

## What Changes

- Monorepo con npm workspaces: `apps/web` (Angular), `apps/api` (NestJS), `packages/shared` (DTOs y tipos).
- API con capas controller → service → repository, TypeORM y MySQL, migraciones versionadas.
- Alta de comercio (`businesses`), sucursales (`branches`), usuarios de staff y roles.
- Autenticación de staff y autorización por rol y por comercio; el repositorio aplica el `business_id` a toda consulta.
- Registro de auditoría (`audit_logs`) de acciones administrativas.
- Campo `plan` y estado del comercio (sin cobro; el cobro llega en F5).
- Armazón del panel en Angular con Tailwind: login, barra lateral, encabezado y página de inicio vacía, siguiendo la referencia visual.
- Inventario de pantallas de F1 y mockups HTML antes de maquetar en Angular.

## Capabilities

### New Capabilities
- `tenancy`: comercios, sucursales y aislamiento de datos por comercio.
- `staff-auth`: autenticación, roles, permisos y auditoría de staff.
- `dashboard-shell`: armazón visual del panel web y sus pantallas de acceso.

### Modified Capabilities

Ninguna.

## Impact

- **Código**: `apps/api`, `apps/web`, `packages/shared`, migraciones MySQL, configuración del monorepo.
- **Dependencias**: NestJS, TypeORM, MySQL driver, Angular, Tailwind, librería de hash de contraseñas y JWT.
- **Seguridad**: secretos por variables de entorno, HTTPS en despliegue, cabeceras seguras.
- **Condición de inicio**: decisión "go" de F0 sobre pases (no requiere la validación de notificaciones).

## Non-goals

- Programas de lealtad, ledger, escáner (F2).
- Registro de clientes y emisión de pases (F3).
- Métricas y cobro (F4, F5).
- SSO o autenticación de clientes finales.
