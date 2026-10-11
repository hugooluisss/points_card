# Design

## Context

Monorepo vacío salvo el spike de F0 en `poc/wallet/`. Stack y capas definidos en `config.yaml`. Ver `proposal.md` para el motivo.

## Goals / Non-Goals

**Goals:**
- Base reutilizable por F2 a F6: capas, scoping por comercio, auth, auditoría, armazón de UI.

**Non-Goals:**
- Reglas de lealtad, Wallet, cobro.

## Decisions

- **Scoping por comercio en el repositorio.** Un repositorio base recibe el `businessId` del contexto de la petición y lo añade a cada consulta; los services nunca construyen filtros de tenant. Alternativa: filtros en cada service; se descarta por riesgo de olvido.
- **Contexto de tenant por petición.** Un guard extrae `userId`, `businessId`, `role` y `branchIds` del token y los deja en un contexto de petición accesible al repositorio.
- **JWT de acceso corto + refresh con rotación.** Alternativa: sesión en base de datos; se descarta para no acoplar cada request a MySQL, aunque el refresh sí se persiste para poder revocarlo.
- **Hash de contraseñas con argon2.** Alternativa: bcrypt; ambos válidos, argon2 es la opción actual.
- **Roles fijos (owner, manager, cashier).** Permisos definidos en código. Alternativa: RBAC dinámico; se descarta (YAGNI), se añade si un comercio lo pide.
- **Migraciones TypeORM versionadas**, sin `synchronize` en ningún entorno distinto del local.
- **Paquete `packages/shared`** con DTOs y enums compartidos entre web y api para evitar divergencia de contratos.
- **UI: Tailwind con componentes propios** (sidebar, tarjeta KPI, tabla, chip de estado). Se diseñan primero como mockups HTML y se aprueban antes de pasarlos a Angular.
- **Auditoría por interceptor** que registra las acciones administrativas marcadas, no cada lectura.

## Risks / Trade-offs

- [Un repositorio se escribe sin el base y se salta el scoping] → Prueba automática que falla si un repositorio no extiende el base; prueba de aislamiento entre dos comercios.
- [Robo de token] → Expiración corta, refresh rotativo y revocable.
- [Acoplar UI a un diseño que cambie] → Componentes pequeños y tokens de diseño centralizados en Tailwind.
