# Proposal

## Why

El comercio necesita ver qué pasa con su programa: cuántos clientes se registraron, cuántas tarjetas se guardaron, qué movimientos y canjes hubo. Esas métricas son también la evidencia de retorno que justifica pagar la suscripción.

## What Changes

- Pantalla de inicio con tarjetas KPI, gráfica de actividad y movimientos recientes, según la referencia visual.
- Listado y detalle de clientes con su tarjeta, saldo y movimientos.
- Listado de movimientos y canjes con filtros por fecha, sucursal y empleado.
- Métricas de retorno: altas, pases guardados, visitas repetidas, canjes y tasa de canje.
- Exportación de movimientos y clientes en CSV.
- Gestión de pases fallidos de sincronización.
- Mockups aprobados antes de maquetar en Angular.

## Capabilities

### New Capabilities
- `admin-dashboard`: pantalla de inicio, KPIs y gráficas del comercio.
- `customer-management`: listado, detalle y exportación de clientes y movimientos.
- `business-metrics`: definición y cálculo de las métricas de retorno.

### Modified Capabilities

Ninguna.

## Impact

- **Código**: módulos de lectura/consulta en `apps/api` y pantallas en `apps/web`.
- **Datos**: consultas agregadas sobre ledger y clientes; índices por `business_id` y fecha.
- **Condición de inicio**: F2 y F3.

## Non-goals

- Analítica predictiva, segmentación avanzada, CRM completo.
- Panel de administración de la plataforma (todos los comercios).
- Reportes programados por correo.
